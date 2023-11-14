const SHIP_IDS = [11, 12, 13, 14, 15, 16, 19, 64, 67, 69, 70, 82, 97]

export class ShipDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            selectedItem: null
        }
        this.buttonRef = React.createRef();
        window.addEventListener('click', this.closeDropdown);

    }

    closeDropdown = (evt) => {
        if (this.buttonRef.current.contains(evt.target)) return;
        this.setState({
            expanded: false
        })
    }
    componentWillUnmount() {
        window.removeEventListener('click', this.closeDropdown);
    }

    toggleDropdown = () => {
        this.setState((oldState) => ({
            expanded: !oldState.expanded
        }));
    }

    itemSelected = (e) => {
        // console.log("ITEM SELECTED");
        // console.log(e.target.attributes.itemid.value);
        const itemId = e.target.attributes.itemid.value;
        this.props.selectionChanged(itemId);
    }

    render() {
        const options = [
            { src: `/images/item-icons/itemANY.png`, itemid: -1 }
        ]
        for (const sId of SHIP_IDS) {
            options.push({src: `/images/item-icons/ship${sId}.png`, itemid: sId});
        }
        let selectedOption;
        const things = [];
        for (const opt of options) {
            things.push(<img {...opt} onClick={this.itemSelected}></img>);
            if (opt.itemid == this.props.selectedId) selectedOption = opt;
        }

        return (
            <div className={"icon-dropdown" + (this.state.expanded ? ' expanded' : '')} onClick={this.toggleDropdown} ref={this.buttonRef} selectedid={this.props.selectedId}>
                <img  {...selectedOption}></img>
                <div className="dropdown-text">{this.props.idx}</div>
                <div className="dropdown-content">
                    {things}
                </div>
            </div>

        );
    }

}