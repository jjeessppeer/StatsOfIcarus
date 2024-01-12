export class FilterBox extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      tagsInclude: [],
      tagsExclude: [],
    }
  }

  getFilterData = () => {
    const filter = {};
    if (this.state.tagsInclude.length > 0) filter.tagsInclude = this.state.tagsInclude;
    if (this.state.tagsExclude.length > 0) filter.tagsExclude = this.state.tagsExclude;
    return filter;
  }

  tagChanged = (label, value) => {
    const tagsInclude = new Set(this.state.tagsInclude);
    const tagsExclude = new Set(this.state.tagsExclude);
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
    this.setState({
      tagsInclude: [...tagsInclude],
      tagsExclude: [...tagsExclude]
    })
  }

  render() {
    const radioState = (label) => {
      if (this.state.tagsExclude.includes(label)) return 0;
      if (this.state.tagsInclude.includes(label)) return 2;
      return 1;
    }

    return (
      <div class="filter-box">
        <ul>
          <FilterCategory title="Tags">
            <TripleRadio label="SCS" value={radioState("SCS")} onChange={this.tagChanged}></TripleRadio>
            <TripleRadio label="Competitive" value={radioState("Competitive")} onChange={this.tagChanged}></TripleRadio>
          </FilterCategory>
          {/* <FilterCategory title="Timespan">
            <TripleRadio label="SCS"></TripleRadio>
            <TripleRadio label="Competitive"></TripleRadio>
          </FilterCategory> */}
        </ul>
      </div>
    );
  }
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

class TripleRadio extends React.PureComponent {
  static defaultProps = {
    value: 1
  }

  onChange = (evt) => {
    this.props.onChange(this.props.label, evt.target.value);
  }

  render() {
    return (
      <div className="triple-radios">
        <div class="radio-container">
          <input type="radio" value="0" checked={this.props.value == 0} onChange={this.onChange}/>
          <input type="radio" value="1" checked={this.props.value == 1} onChange={this.onChange}/>
          <input type="radio" value="2" checked={this.props.value == 2} onChange={this.onChange}/>
        </div>
        <span>{this.props.label}</span>
      </div>
    )
  }
}

