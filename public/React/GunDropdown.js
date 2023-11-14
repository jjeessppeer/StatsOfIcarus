function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const LIGHT_GUN_IDS = [114, 117, 171, 172, 194, 195, 198, 199, 204, 206, 951, 1013, 1884, 1943];
const HEAVY_GUN_IDS = [173, 203, 838, 920, 1086, 1779, 1885, 2069];
export class GunSelectionRow extends React.Component {
  selectionChanged = (idx, selectedId) => {
    this.props.handleChange(idx, selectedId);
  };
  render() {
    const lightOptions = [];
    lightOptions.push({
      src: `/images/item-icons/itemANY.png`,
      itemid: -1
    });
    lightOptions.push({
      src: `/images/item-icons/itemIGNORE.png`,
      itemid: -2
    });
    for (const lgId of LIGHT_GUN_IDS) {
      lightOptions.push({
        src: `/images/item-icons/item${lgId}.jpg`,
        itemid: lgId
      });
      // lightOptions.push(<img src={`/images/item-icons/item${lgId}.jpg`} itemid={lgId} onClick={this.itemSelected}></img>)
    }

    for (const lgId of HEAVY_GUN_IDS) {
      lightOptions.push({
        src: `/images/item-icons/item${lgId}.jpg`,
        itemid: lgId
      });
      // lightOptions.push(<img src={`/images/item-icons/item${lgId}.jpg`} itemid={lgId} onClick={this.itemSelected}></img>)
    }

    const selectedOptions = [];
    for (const selectedId of this.props.selections) {
      const opt = lightOptions.find(el => el.itemid == selectedId);
      selectedOptions.push(opt);
    }
    const gunDropdowns = [];
    for (let i = 0; i < this.props.gunCount; i++) {
      gunDropdowns.push( /*#__PURE__*/React.createElement(GunDropdown, {
        idx: i + 1,
        options: lightOptions,
        selectedOption: selectedOptions[i],
        selectionChanged: this.selectionChanged
      }));
    }
    return /*#__PURE__*/React.createElement("div", null, "Gun selection:", gunDropdowns);
  }
}
export class GunDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      selectedItem: null
    };
    this.buttonRef = React.createRef();
    window.addEventListener('click', this.closeDropdown);
  }
  closeDropdown = evt => {
    if (this.buttonRef.current.contains(evt.target)) return;
    this.setState({
      expanded: false
    });
  };
  componentWillUnmount() {
    // unsubscribe events.
    window.removeEventListener('click', this.closeDropdown);
  }
  toggleDropdown = () => {
    console.log("toggle");
    this.setState(oldState => ({
      expanded: !oldState.expanded
    }));
  };
  itemSelected = e => {
    // console.log("ITEM SELECTED");
    // console.log(e.target.attributes.itemid.value);
    const itemId = e.target.attributes.itemid.value;
    this.props.selectionChanged(this.props.idx, itemId);
  };
  render() {
    const things = [];
    for (const opt of this.props.options) {
      things.push( /*#__PURE__*/React.createElement("img", _extends({}, opt, {
        onClick: this.itemSelected
      })));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "icon-dropdown" + (this.state.expanded ? ' expanded' : ''),
      onClick: this.toggleDropdown,
      ref: this.buttonRef,
      selectedid: this.props.selectedOption.itemid
    }, /*#__PURE__*/React.createElement("img", this.props.selectedOption), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-text"
    }, this.props.idx), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-content"
    }, things));
  }
}