import { SHIP_ITEMS } from '/js/constants.js';
import { FilterBox } from './SearchFilters.js';
import { SearchContext } from "../MatchHistoryPage.js";


function generateSuggestionCategories(searchText) {
  const categoryTitles = [];
  const categoryItems = [];

  const categories = [];

  // Overview category
  if (searchText == "") {
    categories.push({
      title: "Overview",
      items: [{
        text: "Full match history",
        imgSrc: "images/item-icons/coopMap244.jpg"
      }]
    });
    // categoryTitles.push("Overview");
    // categoryItems["Overview"] = [{
    //   text: "Full match history",
    //   imgSrc: "images/item-icons/coopMap244.jpg"
    // }];
  }

  // // Ship category
  // const shipSuggestionItems = [];
  // for (const shipId in SHIP_ITEMS) {
  //   // if (this.props.searchText == "") continue;
  //   const shipName = SHIP_ITEMS[shipId].Name;
  //   if (!shipName.toLowerCase().includes(searchText.toLowerCase())) continue;
  //   shipSuggestionItems.push({
  //     text: shipName,
  //     imgSrc: `images/item-icons/ship${shipId}.jpg`
  //   });
  // }
  // if (shipSuggestionItems.length > 0) {
  //   categoryTitles.push("Ship");
  //   categoryItems["Ship"] = shipSuggestionItems;
  // }

  // Player category
  
  categories.push({
    title: "Player",
    items: [{
      text: searchText,
      imgSrc: "images/item-icons/item1182.jpg"
    }]
  });

  // categoryTitles.push("Player");
  // categoryItems["Player"] = [{
  //   text: searchText,
  //   imgSrc: "images/item-icons/item1182.jpg"
  // }];

  return categories;
}

// Searchbar react element
export function Searchbar() {
  const onDocClick = (evt) => {
    // Close suggeston box if document clicked
    if (searchbarRef.current.contains(evt.target)) return true;
    setSuggestionsOpen(false);
  }

  const { search, setSearch, executeSearch } = React.useContext(SearchContext);

  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const searchbarRef = React.useRef(null);

  React.useEffect(() => {
    // Close suggestions if document is clicked.
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('click', onDocClick)
    }
  }, []);

  // Generate suggestions.
  const categories = generateSuggestionCategories(search.text);
  const suggestionCategories = [];
  for (const category of categories) {
    const suggestionItems = [];
    for (const categoryItem of category.items) {
      const suggestionItem = <SuggestionItem
        category={category.title}
        text={categoryItem.text}
        imgSrc={categoryItem.imgSrc}
        setSuggestionsOpen={setSuggestionsOpen}
      />
      suggestionItems.push(suggestionItem);
    }

    suggestionCategories.push(
      <SuggestionCategory
        title={category.title}
        items={category.items}>
        {suggestionItems}
      </SuggestionCategory>);
  }

  return (
    <div className={"fancy-search filters-open" + (suggestionsOpen ? " open" : "")} ref={searchbarRef}>
      <div className="searchbar">
        <input className="search-input" type="text" placeholder="Search for a player" autocomplete="off"
          value={search.text}
          onChange={evt => {
            setSearch(s => ({
              ...search,
              text: evt.target.value
            }));
          }}
          onFocus={() => setSuggestionsOpen(true)}
          onClick={() => setSuggestionsOpen(true)}
          onKeyDown={evt => {
            if (evt.type === "keydown" && evt.key === 'Enter') {
              setSuggestionsOpen(false);
              executeSearch(categories[0].title);
            }
          }}
        />
        <button class="filter-button">Filters<i class="fas fa-chevron-down"></i></button>
        <button class="search-button" onClick={evt => {
          setSuggestionsOpen(false);
          executeSearch(categories[0].title);
        }}>
          <i class="fas fa-search" />
        </button>
      </div>

      <div class="search-suggestion-box">
        {suggestionCategories}
      </div>
      <FilterBox />
    </div>
  );
}

function SuggestionCategory({ title, items, children }) {
  return (
    <div class="search-category">
      <span class="category-title"><strong>{title}</strong></span>
      <ul class="category-content">
        {children}
      </ul>
    </div>
  );
}

function SuggestionItem({ category, text, imgSrc, setSuggestionsOpen }) {
  const { search, setSearch, executeSearch } = React.useContext(SearchContext);

  const submitSearch = () => {
    setSuggestionsOpen(false);
    executeSearch(category);
  }

  return (
    <li className="category-entry" onClick={submitSearch}>
      <img src={imgSrc} />
      &nbsp;
      <span>{text}</span>
    </li>
  )
}