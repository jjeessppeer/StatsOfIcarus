// const entity_regex = /^[0-9a-fA-F]{8}(,[a-zA-Z0-9]{20}=[^,]{500}){100}$/;
// const timestamp_regex = /^#[0-9]{0,100}(\.[0-9]{0,100})?$/;

const line_regex = /(^[0-9a-fA-F-]{1,8}(,[a-zA-Z0-9]{1,50}=[^,]{1,500}){1,100}$)|(^#[0-9]{1,100}(\.[0-9]{0,100})?$)/;

function isValidAcmi(acmiString) {
    if (typeof(acmiString) !== "string") return false;
    if (acmiString.length > 50000000) return false;
    
    const lineCount = (acmiString.match(/\n/g) || '').length + 1;
    if (lineCount  > 1000000) return false;

    const lines = acmiString.split('\n');

    const l1 = lines.shift();
    if (l1 !== "FileType=text/acmi/tacview") return false;
    const l2 = lines.shift();
    if (l2 !== "FileVersion=2.2") return false;
    if (lines[lines.length - 1] !== "") return false;

    // Each line must be either a timestamp or an object description.
    for (let i = 0; i < lines.length - 1; i++) {
        if (!line_regex.test(lines[i])) {
            console.log(lines[i]);
            return false;
        }
    }
    return true;
}


module.exports = {
    isValidAcmi
};