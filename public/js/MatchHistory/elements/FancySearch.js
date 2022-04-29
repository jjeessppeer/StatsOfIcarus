class FancySearchbar extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('fancy-search')
    this.classList.add('filters-open')
    this.innerHTML = `
      <div class="searchbar">
        <input class="search-input" type="text" placeholder="Search for a player or ship" autocomplete="off">
        <button disabled>Filters<i class="fas fa-chevron-down"></i></button>
        <button class="searchbutton"><i class="fas fa-search"></i></button>
      </div>      
      <div class="search-suggestion-box">
      </div>
      <div class="filter-box">
        <ul>
        <li>FILTER1</li>
        <li>FILTER2</li>
        </ul>
      </div>
    `;
    this.categories = [];

    let tagFiltersElement = document.createElement('li', {is: 'tag-filters'});
    this.querySelector('.filter-box > ul').append(tagFiltersElement)

    this.querySelector('input').addEventListener('focus', evt => {
      this.toggleSuggestionBox(true);
    });
    this.querySelector('input').addEventListener('click', evt => {
      this.toggleSuggestionBox(true);
    });
    document.addEventListener('click', evt => {
      if (!this.contains(evt.target)) this.toggleSuggestionBox(false);
    });


    this.querySelector('input').addEventListener('input', () => this.updateSuggestions());

    // Search events
    this.querySelector("input").addEventListener("keydown", evt => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        this.createSearchEvent();
      }
    });
    this.querySelector(".searchbutton").addEventListener('click', () => this.createSearchEvent());

    let shipListItems = [];
    for (let shipId in SHIP_ITEMS) {
      let item = {
        icon: `images/item-icons/ship${shipId}.jpg`,
        name: SHIP_ITEMS[shipId].Name,
        type: "Ship",
        callback: "TODO"
      }
      shipListItems.push(item);
    }
    // this.addCategory("Ship", shipListItems);
    this.playerCategory = this.addCategory("Search Player", [{
      icon: `images/item-icons/item1182.jpg`,
      type: "Player",
      name: ""
    }]);
    this.addCategory("Recent Searches", [
      // { icon: `images/item-icons/ship123123123.jpg`, name: "recent1" },
      // { icon: `images/item-icons/ship123123123.jpg`, name: "recent2" },
      // { icon: `images/item-icons/ship123123123.jpg`, name: "recent3" },
      // { icon: `images/item-icons/ship123123123.jpg`, name: "recent4" },
    ]);
    this.addCategory("Generic Info", [{ 
      icon: `images/item-icons/coopMap244.jpg`, 
      type: "Overview",
      name: "Generic info" 
    }]);

    this.updateSuggestions();
  }

  setText(text) {
    this.querySelector('.searchbar input').value = text;
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
      listItem.addEventListener('click', () => this.createSearchEvent(item));

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

  createSearchEvent(item) {
    const evt = new CustomEvent("search", {
      detail: this.getSearchQuery(item),
      bubbles: false,
      cancelable: true,
      composed: false,
    });
    this.toggleSuggestionBox(false);
    this.dispatchEvent(evt);
  }

  getSearchQuery(item) {
    if (item == undefined) {
      item = this.getTopItem()[1];
    }
    let query = {
      perspective: {type: item.type, name: item.name},
      filters: []
    };

    // if (item.type == "Player") {
    //   query.filters.push( {type: "Player", data: item.name} );
    // }
    return query;
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
    if (category.name == "Generic Info") {
      // return searchText == "";
      return true;
    }
    return true;
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
    this.playerCategory.items[0].element.querySelector('span').textContent = searchText + "...";


    this.getTopItem();
  }
}

class FilterCategory extends HTMLLIElement {
  constructor(){
    super();
    this.classList.add('filter-category');
    this.innerHTML = `
      <button class="category-title">
        TITLE
      </button>
      <div class="category-content">
      </div>
    `;

    this.content = this.querySelector('.category-content');
    this.content.style.height = '0px';

    this.querySelector('.category-title').addEventListener('click', () => this.toggleOpen());
  }
  toggleOpen(open) {
    if (open == undefined)
      open = this.classList.toggle('open');
    else
      this.classList.toggle('open', open);

    if (open) {
      console.log("OPENING");
      this.content.style.height = this.content.scrollHeight+"px";
    }
    else{
      this.content.style.height = "0px";
    }
    
  }
  setTitle(title) {
    this.querySelector('.category-title').textContent = title;
  }
}


class TagFilters extends FilterCategory {
  constructor(){
    super();
    this.classList.add('tag-filters');
    let scs_triple = document.createElement('div', {is: 'triple-radios'});
    let comp_triple = document.createElement('div', {is: 'triple-radios'});
    let full_triple = document.createElement('div', {is: 'triple-radios'});
    scs_triple.initialize("SCS");
    comp_triple.initialize("Competitive");
    full_triple.initialize("Match Full");
    this.content.append(scs_triple)
    this.content.append(comp_triple)
    this.content.append(full_triple)
    this.setTitle('Match Tags');
    this.toggleOpen(true);
    this.toggleOpen(true);
  }
}

class TripleRadios extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('triple-radios');

    this.innerHTML = `
      <div class="radio-container">
        <input type="radio" name="radio" />
        <input type="radio" name="radio" checked/>
        <input type="radio" name="radio" />
      </div>
      <span>LABEL</span>
    `;
  }
  initialize(labelText, groupName) {
    if (groupName == undefined) groupName = labelText;
    this.querySelectorAll('input').forEach(el => el.name = labelText);
    this.querySelector('span').textContent = labelText;
  }
}




customElements.define('triple-radios', TripleRadios, { extends: 'div' });
customElements.define('fancy-searchbar', FancySearchbar, { extends: 'div' });
customElements.define('tag-filters', TagFilters, { extends: 'li' });



// function initializeSearchbar() {
//   let searchbar = document.createElement('div', { is: 'fancy-searchbar' });
//   document.getElementById('matchHistorySearch').append(searchbar);
// }