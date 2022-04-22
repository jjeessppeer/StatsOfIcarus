class FancySearchbar extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('fancy-search')
    this.innerHTML = `
      <div class="searchbar">
        <input class="search-input" type="text" placeholder="Search for a player or ship" autocomplete="off">
        <button>Filters<i class="fas fa-chevron-down"></i></button>
        <button><i class="fas fa-search"></i></button>
      </div>      
      <div class="search-suggestion-box">
      </div>
    `;
    this.categories = [];

    this.querySelector('input').addEventListener('focus', () => this.toggleSuggestionBox(true));
    this.querySelector('input').addEventListener('click', () => this.toggleSuggestionBox(true));
    this.querySelector('input').addEventListener('focusout', () => this.toggleSuggestionBox(false));
    this.querySelector("input").addEventListener("keydown", evt => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        this.toggleSuggestionBox(false)
      }
    });
    this.querySelector('input').addEventListener('input', () => this.updateSuggestions());


    let shipListItems = [];
    for (let shipId in SHIP_ITEMS) {
      let item = {
        icon: `images/item-icons/ship${shipId}.jpg`,
        name: SHIP_ITEMS[shipId].Name,
        callback: "TODO"
      }
      shipListItems.push(item);
    }
    this.addCategory("Ship", shipListItems);
    this.playerCategory = this.addCategory("Search Player", [{
      icon: `images/item-icons/ship123123123.jpg`,
      name: "PlayerName"
    }]);
    this.addCategory("Recent Searches", [
      { icon: `images/item-icons/ship123123123.jpg`, name: "recent1" },
      { icon: `images/item-icons/ship123123123.jpg`, name: "recent2" },
      { icon: `images/item-icons/ship123123123.jpg`, name: "recent3" },
      { icon: `images/item-icons/ship123123123.jpg`, name: "recent4" },
    ]);

    this.updateSuggestions();
  }

  
  addCategory(categoryName, categoryItems) {
    let categoryData = { name: categoryName, items: [], element: undefined }
    this.categories.push(categoryData);
    console.log("ADDING CATEGORY");
    let categoryElement = htmlToElement(`
      <div class="search-category">
        <span class="category-title"><strong>${categoryName}</strong></span>
        <ul class="category-content"> </ul>
      </div>`);
    categoryData.element = categoryElement;
    for (let item of categoryItems) {
      let listItem = htmlToElement(`
                <li class="category-entry">
                <img src="${item.icon}">
                <span>${item.name}</span>
                </li>`);

      // <span>${item.name}</span>

      item.element = listItem;
      categoryData.items.push(item);
      categoryElement.querySelector('ul').append(listItem);

    }

    this.querySelector('.search-suggestion-box').append(categoryElement);

    return categoryData;
  }

  toggleSuggestionBox(open) {
    this.classList.toggle('open', open);
  }

  getTopItem(){
    // Return first displayed item and category.
    for (let category of this.categories) {
      for (let item of category.items) {
        if (this.itemFilterStatus(category, item)) {
          return [category, item];
        }
      }
    }
  }

  itemFilterStatus(category, item) {
    // Return weather an item should be shown in the suggestion box or not.
    let searchText = this.querySelector('input').value;
    if (category.name == "Search Player") {
      return searchText != "";
    }
    if (category.name == "Ship") {
      // Show ships matching query unless its empty.
      if (searchText == "") return false;
      let match = item.name.match(new RegExp(searchText, "i"));
      return match != null;
    }
    if (category.name == "Recent Searches") {
      // Only show recent searches if nothing is typed.
      return searchText == "";
    }
    return false;
  }

  updateSuggestions() {
    // Update suggestion list. Only show matching items
    for (let category of this.categories) {
      let hiddenCount = 0;
      // Hide non matching items
      for (let item of category.items) {
        let hideItem = this.itemFilterStatus(category, item);
        if (!hideItem) {
          item.element.style = "display: none;";
          hiddenCount += 1;
        }
        else item.element.style = "display: block;";
      }
      // Hide empty categories
      if (hiddenCount == category.items.length) {
        category.element.style = "display: none;";
      }
      else {
        category.element.style = "display: block;";
      }
    }

    // Update player suggestion item to match search text
    let searchText = this.querySelector('input').value;
    this.playerCategory.items[0].name = searchText;
    this.playerCategory.items[0].element.querySelector('span').textContent = searchText;


    this.getTopItem();
  }
}
customElements.define('fancy-searchbar', FancySearchbar, { extends: 'div' });

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

function initializeSearchbar() {
  let searchbar = document.createElement('div', { is: 'fancy-searchbar' });
  document.getElementById('matchHistorySearch').append(searchbar);
  // let input = document.querySelector('.fancy-search .search-input');
  // console.log(input);
  // input.addEventListener('focus', () => console.log("WWW"))
}
// initializeSearchbar();

console.log("ASDASDASDASDS")