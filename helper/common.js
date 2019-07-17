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

exports.price = function (type, size, quantity) {
    quantity = (quantity > 1) ? quantity : 1;
    switch (type) {
        case "cone":
            switch (size) {
                case "regular":
                    return "$" + getConePrice("R", quantity);
                case "large":
                    return "$" + getConePrice("L", quantity);
            }
            break;
        case "cup":
            return "$" + getCupPrice(quantity);
    }
}

function getConePrice(type, quantity) {
    var regularPrice = 2.50;
    var largePrice = 3.75;
    if (type == "R") {
        return regularPrice * quantity;
    } else if (type == "L") {
        return largePrice * quantity;
    }
}

function getCupPrice(quantity) {
    var quarterPrice = 1;
    return quarterPrice * quantity;
}