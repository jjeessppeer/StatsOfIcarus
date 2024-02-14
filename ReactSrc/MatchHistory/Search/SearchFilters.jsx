import { SearchContext } from "../MatchHistoryPage.js";

export function FilterBox() {
  const tagRadioState = (label) => {
    if (search.ui.filter.tagsExclude?.includes(label)) return 0;
    if (search.ui.filter.tagsInclude?.includes(label)) return 2;
    return 1;
  }

  const tagChanged = (label, value) => {
    const tagsInclude = new Set(search.ui.filter.tagsInclude);
    const tagsExclude = new Set(search.ui.filter.tagsExclude);
    if (value == 0) {
      tagsInclude.delete(label);
      tagsExclude.add(label);
    }
    if (value == 1) {
      tagsInclude.delete(label);
      tagsExclude.delete(label);
    }
    if (value == 2) {
      tagsInclude.add(label);
      tagsExclude.delete(label);
    }
    setSearch(s => {
      const newSearch = { ...s };
      newSearch.ui.filter.tagsExclude = [...tagsExclude];
      newSearch.ui.filter.tagsInclude = [...tagsInclude];
      if (tagsExclude.size === 0) delete newSearch.ui.filter.tagsExclude;
      if (tagsInclude.size === 0) delete newSearch.ui.filter.tagsInclude;
      return newSearch;
    });
  }

  const { search, setSearch } = React.useContext(SearchContext);

  return (
    <div class="filter-box">
      <ul>
        <FilterCategory title="Tags">
          <TripleRadio label="SCS" value={tagRadioState("SCS")} onChange={tagChanged}></TripleRadio>
          <TripleRadio label="Competitive" value={tagRadioState("Competitive")} onChange={tagChanged}></TripleRadio>
        </FilterCategory>
        {/* <FilterCategory title="Timespan">
            <TripleRadio label="SCS"></TripleRadio>
            <TripleRadio label="Competitive"></TripleRadio>
          </FilterCategory> */}
      </ul>
    </div>
  );
}

class FilterCategory extends React.PureComponent {
  render() {
    return (
      <li className="filter-category tag-filters">
        <button class="category-title">{this.props.title}</button>
        <div class="category-content">
          {this.props.children}
        </div>
      </li>
    );
  }
}

function TripleRadio({label, value, onChange}) {
  const valueChanged = (evt) => {
    onChange(label, evt.target.value);
  }

  return (
    <div className="triple-radios">
      <div class="radio-container">
        <input type="radio" value="0" checked={value == 0} onChange={valueChanged} />
        <input type="radio" value="1" checked={value == 1} onChange={valueChanged} />
        <input type="radio" value="2" checked={value == 2} onChange={valueChanged} />
      </div>
      <span>{label}</span>
    </div>
  );
}

