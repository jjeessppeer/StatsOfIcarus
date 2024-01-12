import { SHIP_ITEMS } from '/js/constants.js';
import { FilterBox } from './SearchFilters.js';

export class Searchbar extends React.PureComponent {
  constructor(props) {
    super(props);

    this.searchbarRef = React.createRef();
    this.filterBoxRef = React.createRef();

    const [categoryTitles, categoryItems] = this.generateSuggestionCategories("");
    this.state = {
      displaySuggestions: false,
      searchText: "",
      categoryTitles: categoryTitles,
      categoryItems: categoryItems,
      filter: {}
    }
  }

  generateSuggestionCategories(searchText) {
    const categoryTitles = [];
    const categoryItems = [];

    // Overview category
    if (searchText == "") {
      categoryTitles.push("Overview");
      categoryItems["Overview"] = [{
        text: "Full match history",
        imgSrc: "images/item-icons/coopMap244.jpg"
      }];
    }

    // Ship category
    const shipSuggestionItems = [];
    for (const shipId in SHIP_ITEMS) {
      // if (this.props.searchText == "") continue;
      const shipName = SHIP_ITEMS[shipId].Name;
      if (!shipName.toLowerCase().includes(searchText.toLowerCase())) continue;
      shipSuggestionItems.push({
        text: shipName,
        imgSrc: `images/item-icons/ship${shipId}.jpg`
      });
    }
    if (shipSuggestionItems.length > 0) {
      categoryTitles.push("Ship");
      categoryItems["Ship"] = shipSuggestionItems;
    }

    // Player category
    categoryTitles.push("Player");
    categoryItems["Player"] = [{
      text: searchText,
      imgSrc: "images/item-icons/item1182.jpg"
    }];

    return [categoryTitles, categoryItems]
  }

  componentDidMount() {
    document.addEventListener('click', this.onDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocClick);
  }

  // loadState = () => {
  // }

  onDocClick = (evt) => {
    if (!this.searchbarRef.current.contains(evt.target)) this.hideSuggestionBox();
  }

  searchTextSubmit = (evt) => {
    if (evt.type == "keydown" && evt.key !== 'Enter') return;
    const category = this.state.categoryTitles[0];
    this.executeSearch(category, this.state.searchText);
  }

  executeSearch = (category, text) => {
    if (category == 'Overview') text = "";
    this.setState({
      displaySuggestions: false, 
      searchText: text
    });
    this.props.executeSearch(category, text, this.filterBoxRef.current.getFilterData());
  }

  searchInputChanged = (evt) => {
    const [categoryTitles, categoryItems] = this.generateSuggestionCategories(evt.target.value);
    this.setState({
      searchText: evt.target.value,
      categoryTitles: categoryTitles,
      categoryItems: categoryItems
    });
  }

  showSuggestionBox = () => {
    this.setState({ displaySuggestions: true });
  }

  hideSuggestionBox = () => {
    this.setState({ displaySuggestions: false });
  }

  render() {
    const suggestionCategories = [];
    for (const category of this.state.categoryTitles) {
      const suggestionItems = [];
      for (const item of this.state.categoryItems[category]) {
        const suggestionItem = <SuggestionItem
          text={item.text}
          category={category}
          imgSrc={item.imgSrc}
          executeSearch={this.executeSearch}
        />
        suggestionItems.push(suggestionItem);
      }
      suggestionCategories.push(<SuggestionCategory
        title={category}
        items={suggestionItems}
      />)
    }

    return (
      <div className={"fancy-search filters-open" + (this.state.displaySuggestions ? " open" : "")} ref={this.searchbarRef}>
        <div class="searchbar">
          <input class="search-input" type="text" placeholder="Search for player or ship" autocomplete="off"
            value={this.state.searchText}
            onChange={this.searchInputChanged}
            onFocus={this.showSuggestionBox}
            onClick={this.showSuggestionBox}
            // onBlur={this.hideSuggestionBox}
            onKeyDown={this.searchTextSubmit} />
          <button class="filter-button">Filters<i class="fas fa-chevron-down"></i></button>
          <button class="search-button"><i class="fas fa-search" onClick={this.searchTextSubmit}></i></button>
        </div>

        <div class="search-suggestion-box">
          {suggestionCategories}
        </div>
        <FilterBox ref={this.filterBoxRef}
        />
      </div>
    );
  }
}

class SuggestionCategory extends React.PureComponent {
  render() {
    return (
      <div class="search-category">
        <span class="category-title"><strong>{this.props.title}</strong></span>
        <ul class="category-content">
          {this.props.items}
        </ul>
      </div>
    )
  }
}

class SuggestionItem extends React.PureComponent {
  render() {
    return (
      <li className="category-entry" onClick={() => this.props.executeSearch(this.props.category, this.props.text)}>
        <img src={this.props.imgSrc} />
        &nbsp;
        <span>{this.props.text}</span>
      </li>
    )
  }
}
