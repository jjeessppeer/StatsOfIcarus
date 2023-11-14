import { SHIP_ITEMS } from '/js/MatchHistory/matchHistory.js';

class FancySearchbar extends HTMLDivElement {
  constructor() {
    super();

    this.classList.add('fancy-search');
    this.classList.add('filters-open');
    this.innerHTML = `
      <div class="searchbar">
        <input class="search-input" type="text" placeholder="Search for a player or ship" autocomplete="off">
        <button class="filter-button">Filters<i class="fas fa-chevron-down"></i></button>
        <button class="search-button"><i class="fas fa-search"></i></button>
      </div>      
      <div class="search-suggestion-box">
      </div>
      <div class="filter-box">
        <ul>
        </ul>
      </div>
    `;
    this.categories = [];
    this.filterCategories = {};

    let tagFiltersElement = document.createElement('li', {is: 'tag-filters'});
    this.filterCategories['TagFilters'] = tagFiltersElement;

    this.querySelector('.filter-box').addEventListener('change', evt => {
      console.log("Filters changed");
      this.classList.toggle('filters-changed', true);
      console.log(this.filterCategories['TagFilters'].getMatchFilters());
      evt.stopPropagation();
    });
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
    this.querySelector(".search-button").addEventListener('click', () => this.createSearchEvent());

    
    

    let shipListItems = [];
    for (let shipId in SHIP_ITEMS) {
      let item = {
        icon: `images/item-icons/ship${shipId}.jpg`,
        name: SHIP_ITEMS[shipId].Name,
        type: "Ship"
      }
      shipListItems.push(item);
    }

    // this.addCategory("Recent Searches", [
    //   // { icon: `images/item-icons/ship123123123.jpg`, name: "recent1" },
    //   // { icon: `images/item-icons/ship123123123.jpg`, name: "recent2" },
    //   // { icon: `images/item-icons/ship123123123.jpg`, name: "recent3" },
    //   // { icon: `images/item-icons/ship123123123.jpg`, name: "recent4" },
    // ]);
    this.addCategory("Full match history", [{ 
      icon: `images/item-icons/coopMap244.jpg`, 
      type: "Overview",
      name: "Full match history" 
    }]);

    this.addCategory("Ship", shipListItems);

    this.playerCategory = this.addCategory("Search Player", [{
      icon: `images/item-icons/item1182.jpg`,
      type: "Player",
      name: ""
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
    this.classList.toggle('filters-changed', false);
    const evt = new CustomEvent("search", {
      detail: this.getSearchQuery(item),
      bubbles: false,
      cancelable: true,
      composed: false,
    });
    this.toggleSuggestionBox(false);
    this.dispatchEvent(evt);
  }

  getMatchFilters() {
    return this.filterCategories['TagFilters'].getMatchFilters();
  }

  getSearchQuery(item) {
    if (item == undefined) {
      item = this.getTopItem()[1];
    }
    let query = {
      perspective: {type: item.type, name: item.name},
      filters: this.getMatchFilters()
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
      return true
      // return searchText != "";
    }
    if (category.name == "Ship") {
      // Show ships matching query unless its empty.
      // return true
      // if (searchText == "") return false;
      let match = item.name.match(new RegExp(searchText, "i"));
      return match != null;
    }
    if (category.name == "Recent Searches") {
      // Only show recent searches if nothing is typed.
      return searchText == "";
    }
    if (category.name == "Full match history") {
      return searchText == "";
      // return true;
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
        <div>
        </div>
      </div>
    `;
    this.contentTab = this.querySelector('.category-content');
    this.content = this.querySelector('.category-content > div');
    // this.content.style.height = '0px';

    this.querySelector('.category-title').addEventListener('click', () => this.toggleOpen());
  }
  toggleOpen(open, delay=true) {
    return
    if (delay) {
      setTimeout(() => this.toggleOpen(open, false), 10);
    }
    if (open == undefined)
      open = this.classList.toggle('open');
    else
      this.classList.toggle('open', open);

    if (open) {
      this.contentTab.style.height = this.contentTab.scrollHeight+"px";
    }
    else{
      this.contentTab.style.height = "0px";
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
    this.tripletElements = [];
    this.addTag('SCS');
    this.addTag('Competitive');
    this.addTag('PlayersFull');
    this.setTitle('Tag Filters');
    this.toggleOpen(true);
  }

  addTag(tagName) {
    let tripleRadio = document.createElement('div', {is: 'triple-radios'});
    tripleRadio.initialize(tagName);
    this.tripletElements.push(tripleRadio);
    this.content.append(tripleRadio);
  }

  getMatchFilters() {
    let tagsInclude = [];
    let tagsExclude = [];
    this.tripletElements.forEach(el => {
      if (el.value == 2) {
        tagsInclude.push(el.label);
      }
      if (el.value == 0) {
        tagsExclude.push(el.label);
      }
    });
    let filters = [];
    if (tagsInclude.length != 0) 
      filters.push({type: "TagsInclude", tags: tagsInclude});
    if (tagsExclude.length != 0)
      filters.push({type: "TagsExclude", tags: tagsExclude});
    return filters;
  }
}

class TripleRadios extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('triple-radios');

    this.innerHTML = `
      <div class="radio-container">
        <input type="radio" name="radio" value="0" />
        <input type="radio" name="radio" value="1" checked/>
        <input type="radio" name="radio" value="2" />
      </div>
      <span>LABEL</span>
    `;
    this.value = "1";
    this.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', evt => {
        this.value = evt.target.value;
      });
    });
  }
  initialize(labelText, groupName) {
    this.label = labelText;
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