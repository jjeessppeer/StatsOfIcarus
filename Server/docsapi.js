const fetch = require('node-fetch');

class Dataset {
    constructor(title_array, content_array) {
        this.titles = title_array;
        this.content = content_array;
        for (let i = 0; i < this.content.length; i++) {
            if (this.content[i].length != this.titles.length){
                console.log("WARNING BAD CONTENT ROW: \n" + this.content[i]);
                this.content.splice(i, 1);
                i--;
            }
        }
        this.sanitizeDataset();
    }

    sanitizeDataset(){
        for (let i=0; i<this.titles.length; i++){
            this.titles[i] = sanitizeHtml(this.titles[i])
        }
        for (let i=0; i<this.content.length; i++){
            for (let j=0; j<this.content[i].length; j++){
                this.content[i][j] = sanitizeHtml(this.content[i][j])
            }
        }
    }

    filterByStringMultiCol(query_string, dataset_titles, exclude, case_sensitive) {
        // Return matching 
        let col_idxs = [];
        for (let i = 0; i < dataset_titles.length; i++) {
            let col_index = this.titles.indexOf(dataset_titles[i]);
            if (col_index == -1)
                return new Dataset(this.titles, []);
            col_idxs.push(col_index);
        }

        let result_rows = []
        for (let i = 0; i < this.content.length; i++) {
            for (let j = 0; j < col_idxs.length; j++) {
                if (case_sensitive && exclude != this.content[i][col_idxs[j]].includes(query_string)) {
                    result_rows.push(this.content[i]);
                    break;
                }
                else if (!case_sensitive && exclude != this.content[i][col_idxs[j]].toLowerCase().includes(query_string.toLowerCase())) {
                    result_rows.push(this.content[i]);
                    break;
                }
            }

        }
        return new Dataset(this.titles, result_rows);
    }

    filterByString(query_string, dataset_title, exclude=false, case_sensitive=false) {
        // Return matching 
        let col_index = this.titles.indexOf(dataset_title);
        if (col_index == -1)
            return new Dataset(this.titles, []);
        let result_rows = []
        for (let i = 0; i < this.content.length; i++) {
            if (case_sensitive && exclude != this.content[i][col_index].includes(query_string))
                result_rows.push(this.content[i]);
            else if (!case_sensitive && exclude != this.content[i][col_index].toLowerCase().includes(query_string.toLowerCase()))
                result_rows.push(this.content[i]);
        }
        return new Dataset(this.titles, result_rows);
    }

    filterByDate(query, dataset_title, exclude, after) {
        // let query_date = parseDate(query);
        let query_date = new Date(Date.parse(query));
        if (!query_date) {
            return new Dataset(this.titles, this.content);
        }
        let col_index = this.titles.indexOf(dataset_title);
        if (col_index == -1)
            return new Dataset(this.titles, []);
        let result_rows = []
        for (let i = 0; i < this.content.length; i++) {
            let db_date = new Date(this.content[i][col_index]);
            if (exclude != (after == (query_date <= db_date)))
                result_rows.push(this.content[i]);

        }
        return new Dataset(this.titles, result_rows);
    }

    filterByRow(start_row, end_row=start_row){
        let result_rows = [];
        for (var i = start_row; i <= end_row; i++) {
            result_rows.push(this.content[i]);
        }
        return new Dataset(this.titles, result_rows);
    }

    sortDatasetContent(sort_title, valueFunction){
        let col_index = this.titles.indexOf(sort_title);
        if (col_index == -1)
            return false;
        this.content.sort(function(x, y){
            if (valueFunction(x[col_index]) < valueFunction(y[col_index])){
                return 1;
            }
            if (valueFunction(x[col_index]) > valueFunction(y[col_index])){
                return -1;
            }
            return 0;
        });
    }

    getCellByString(query_string, search_title, return_title){
        // Return first cell matching query and title, if multiple matches exist returns top one.
        let col_index = this.titles.indexOf(return_title);
        if (col_index == -1)
            return false;
        return this.filterByString(query_string, search_title).getDatasetRow(0)[col_index];
    }

    getNOfRows(){
        return this.content.length;
    }

    getDatasetRows() {
        return this.content;
    }

    getDatasetRow(x) {
        return this.content[x];
    }

    getDatasetCell(y, x) {
        return this.content[y][x];
    }

    getFirstCellByTitle(return_title){
        let col_index = this.titles.indexOf(return_title);
        if (col_index == -1)
            return false;
        return this.getDatasetCell(0, col_index);
    }

    getEmptyContent() {
        return new Dataset(this.titles, []);
    }

    mergeDataset(otherDataset) {
        return new Dataset(this.titles, this.content.concat(otherDataset.content));
    }

}

function loadDatasetFromSheet(sheet_id, sheet_page, load_callback) {
    let href = "https://spreadsheets.google.com/feeds/cells/" + sheet_id + "/" + sheet_page + "/public/full?alt=json";
    fetch(href)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            // console.log(myJson);
            let dataset = sheetToDataset(myJson);
            load_callback(dataset);
        })
}

function sheetToDataset(sheet_json) {
    let entries = sheet_json.feed.entry;

    let db_arr = [];

    let last_y = -1;
    for (let i = 0; i < entries.length; i++) {
        let y = parseInt(entries[i]["gs$cell"].row) - 1;
        let x = parseInt(entries[i]["gs$cell"].col) - 1;
        // console.log("x: ", x, ", y: ", y);
        if (y != last_y) {
            // Create new row
            last_y = y;
            db_arr.push([]);
        }
        // Push column to current row
        db_arr[last_y].push(entries[i]["gs$cell"].inputValue);
    }

    titles = db_arr[0];
    db_arr.shift();
    content = db_arr;
    return new Dataset(titles, content)
}

function jsonToDataset(dataset_arr, titles){
    let content = [];
    // console.log(dataset_arr);
    for (let i = 0; i < dataset_arr.length; i++) {
        let row = [];
        for (let j=0; j<titles.length; j++){
            // console.log(titles[j].replace(" ", ""));
            row.push(dataset_arr[i][titles[j].replace(/ /g, "").replace(",", "")]);
        }
        content.push(row);
    }
    return new Dataset(titles, content);
}

function sanitizeHtml(str){
    str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


module.exports = {
    Dataset: Dataset,
    loadDatasetFromSheet: loadDatasetFromSheet
};