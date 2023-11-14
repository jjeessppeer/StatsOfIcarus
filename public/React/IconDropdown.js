function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
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
  // componentWillUnmount() {
  // unsubscribe events.
  // }

  toggleDropdown = () => {
    console.log("toggle");
    this.setState(oldState => ({
      expanded: !oldState.expanded
    }));
  };
  itemSelected = e => {
    console.log("ITEM SELECTED");
    console.log(e.target.attributes.itemid.value);
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
      ref: this.buttonRef
    }, /*#__PURE__*/React.createElement("img", this.props.selectedOption), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-text"
    }, this.props.idx), /*#__PURE__*/React.createElement("div", {
      className: "dropdown-content"
    }, things));
  }
}