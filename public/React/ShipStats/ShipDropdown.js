function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const SHIP_IDS = [11, 12, 13, 14, 15, 16, 19, 64, 67, 69, 70, 82, 97];
export class ShipDropdown extends React.Component {
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
    window.removeEventListener('click', this.closeDropdown);
  }
  toggleDropdown = () => {
    this.setState(oldState => ({
      expanded: !oldState.expanded
    }));
  };
  itemSelected = e => {
    // console.log("ITEM SELECTED");
    // console.log(e.target.attributes.itemid.value);
    const itemId = e.target.attributes.itemid.value;
    this.props.selectionChanged(itemId);
  };
  render() {
    const options = [{
      src: `/images/item-icons/itemANY.png`,
      itemid: -1
    }];
    for (const sId of SHIP_IDS) {
      options.push({
        src: `/images/item-icons/ship${sId}.png`,
        itemid: sId
      });
    }
    let selectedOption;
    const things = [];
    for (const opt of options) {
      things.push( /*#__PURE__*/React.createElement("img", _extends({}, opt, {
        onClick: this.itemSelected
      })));
      if (opt.itemid == this.props.selectedId) selectedOption = opt;
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "icon-dropdown" + (this.state.expanded ? ' expanded' : ''),
      onClick: this.toggleDropdown,
      ref: this.buttonRef,
      selectedid: this.props.selectedId
    }, /*#__PURE__*/React.createElement("img", selectedOption), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-text"
    }, this.props.idx), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-content"
    }, things));
  }
}