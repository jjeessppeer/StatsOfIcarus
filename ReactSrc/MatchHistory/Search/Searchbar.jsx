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
    console.log("SEARCHING!")
    setSearch(s => ({
      ...s,
      active: JSON.parse(JSON.stringify(s.ui))
    }));
  }

  const onDocClick = (evt) => {
    // Close suggeston box if 
    if (searchbarRef.current.contains(evt.target)) return true;
    setSuggestionsOpen(false);
  }

  const { search, setSearch } = React.useContext(SearchContext);
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
  const categories = generateSuggestionCategories(search.ui.text);
  const suggestionCategories = [];
  for (const categoryTitle in categories) {
    const suggestionItems = [];
    for (const item of categories[categoryTitle]) {
      const suggestionItem = <SuggestionItem
        category={categoryTitle}
        text={item.text}
        imgSrc={item.imgSrc}
      />
      suggestionItems.push(suggestionItem);
    }

    suggestionCategories.push(
      <SuggestionCategory
        title={categoryTitle}
        items={categories[categoryTitle]}>
        {suggestionItems}
      </SuggestionCategory>);
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
    <div className={"fancy-search filters-open" + (suggestionsOpen ? " open" : "")} ref={searchbarRef}>
      <div className="searchbar">
        <input className="search-input" type="text" placeholder="Search for a player" autocomplete="off"
          value={search.ui.text}
          onChange={evt => setSearch({ ...search, ui: { ...search.ui, text: evt.target.value } })}
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

function SuggestionItem({ category, text, imgSrc }) {
  const { search, setSearch } = React.useContext(SearchContext);

  const submitSearch = () => {
    setSearch(s => {
      const ui = JSON.parse(JSON.stringify(s.ui));
      ui.mode = category;
      ui.text = category == "Overview" ? "" : text;
      return {
        ...s,
        ui: ui,
        active: JSON.parse(JSON.stringify(ui))
      };
    });
  }

  return (
    <li className="category-entry" onClick={submitSearch}>
      <img src={imgSrc} />
      &nbsp;
      <span>{text}</span>
    </li>
  )
}