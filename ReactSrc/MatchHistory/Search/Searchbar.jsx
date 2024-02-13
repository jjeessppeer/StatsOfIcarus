import { SHIP_ITEMS } from '/js/constants.js';
import { FilterBox } from './SearchFilters.js';
import { SearchContext } from "../MatchHistoryPage.js";


function generateSuggestionCategories(searchText) {
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

  return categoryItems
}

// Searchbar react element
export function Searchbar() {
  const submitSearch = () => {
    console.log("SEARCHING!!!!");
    console.log(preSearch);
    setSearch(preSearch);
  }

  const onDocClick = (evt) => {
    if (searchbarRef.current.contains(evt.target)) return;
    setSuggestionsOpen(false);
  }

  // Active search state
  const { search, setSearch } = React.useContext(SearchContext);
  // Uncommitted Search state in the UI
  const [preSearch, setPreSearch] = React.useState({
    ...search,
    filter: {},
    executeSearch: submitSearch
  });
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);

  const searchbarRef = React.useRef(null);

  React.useEffect(() => {
    // Close suggestions if document is clicked.
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('click', onDocClick)
    }
  }, []);
  
  // Generate and add suggestions.
  const categories = generateSuggestionCategories(preSearch.text);
  const suggestionCategories = [];
  for (const categoryTitle in categories) {
    suggestionCategories.push(<SuggestionCategory
      title={categoryTitle}
      items={categories[categoryTitle]}
    />);
  }

  // Check if the search input has been changed.
  // let searchChanged = false;
  // for (const key in preSearch) {
  //   if (key === "executeSearch") continue;
  //   if (search[key] !== preSearch[key]) {
  //     console.log(key)
  //     searchChanged = true;
  //     break;
  //   }
  // }

  return (
    <SearchContext.Provider value={{ search: preSearch, setSearch: setPreSearch }}>
      <div className={"fancy-search filters-open" + (suggestionsOpen ? " open" : "")} ref={searchbarRef}>
        <div className="searchbar">
          <input className="search-input" type="text" placeholder="Search for player or ship" autocomplete="off"
            value={preSearch.text}
            onChange={evt => setPreSearch({...preSearch, text: evt.target.value})}
            onFocus={() => setSuggestionsOpen(true)}
            // onClick={() => setSuggestionsOpen(true)}
            // onBlur={() => setSuggestionsOpen(false)}
            onKeyDown={evt => { if (evt.type === "keydown" && evt.key === 'Enter') submitSearch() }} />
          <button class="filter-button">Filters<i class="fas fa-chevron-down"></i></button>
          <button class="search-button"><i class="fas fa-search" onClick={submitSearch}></i></button>
        </div>

        <div class="search-suggestion-box">
          {suggestionCategories}
        </div>
        <FilterBox />
      </div>
    </SearchContext.Provider>
  );
}

function SuggestionCategory({title, items}) {
  const suggestionItems = [];
  for (const item of items) {
    const suggestionItem = <SuggestionItem
      category={title}
      text={item.text}
      imgSrc={item.imgSrc}
    />
    suggestionItems.push(suggestionItem);
  }

  return (
    <div class="search-category">
      <span class="category-title"><strong>{title}</strong></span>
      <ul class="category-content">
        {suggestionItems}
      </ul>
    </div>
  );
}

function SuggestionItem({category, text, imgSrc}) {
  const { search, setSearch } = React.useContext(SearchContext);

  const onClick = () => {
      setSearch({...search, text: text});
      search.executeSearch();
  };

  return (
    <li className="category-entry" onClick={onClick}>
      <img src={imgSrc} />
      &nbsp;
      <span>{text}</span>
    </li>
  )
}