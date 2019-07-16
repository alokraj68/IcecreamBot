var exports = module.exports.Common = {};
exports.toTitleCase = function (str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

// 1 unit price is $0.50
// 1 cup quarter ice cream = $1
// 1 regular cone  = $2.50
// 1 large cone = $3.75

exports.price = function (type, size) {
    switch (type) {
        case "cone":
            switch (size) {
                case "regular":
                    return "$2.50";

                case "large":
                    return "$3.75";
            }
            break;
        case "cup":
            return "$1.00";
    }
}