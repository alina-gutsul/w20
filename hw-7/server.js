var http = require('http');

var storage = {
    orders : [
        {'id': 1, 'customerId': 12, 'items': [1, 5, 18] },
        {'id': 2, 'customerId': 2, 'items': [7, 87, 98] },
        {'id': 3, 'customerId': 7, 'items': [4, 7, 9] },
        {'id': 4, 'customerId': 12, 'items': [5, 7, 76] },
        {'id': 5, 'customerId': 64, 'items': [1, 7, 67] },
        {'id': 6, 'customerId': 135, 'items': [1, 3, 8] },
        {'id': 7, 'customerId': 1, 'items': [1, 5] },
        {'id': 8, 'customerId': 7, 'items': [7, 8, 90] },
        {'id': 9, 'customerId': 112, 'items': [87, 98] },
        {'id': 10, 'customerId': 67, 'items': [56, 78, 656, 898] },
        {'id': 11, 'customerId': 48, 'items': [1, 56, 98] },
        {'id': 12, 'customerId': 5, 'items': [1, 7, 79] },
        {'id': 13, 'customerId': 9, 'items': [78, 90, 234] },
        {'id': 14, 'customerId': 31, 'items': [87, 498, 878] },
        {'id': 15, 'customerId': 67, 'items': [7, 67] }
    ],

    getOrders: function(page, limit) {
        var data = '';
        var last = page * limit,
            first = last - limit;

        this.orders.slice(first, last).forEach((order) => {
            data += JSON.stringify(order) + '\n';
        });
        return data;
    },

    getPagesNumber: function(limit) {
        return  Math.ceil(this.orders.length / limit);
    }
};


//function creates links to: first page, prev page, current page, next page, last page
//the output is an array with generated links
function createLinks(currentPage, currentLimit) {
    var uri = '127.0.0.1:8080/orders?page=',
        last = storage.getPagesNumber(currentLimit),
        prev = parseInt(currentPage) - 1,
        next = parseInt(currentPage) + 1,
        links = [];
    links.push(uri + '1&limit=' + currentLimit + 'rel="first"'); 
    if (prev > 0)    
        links.push(uri + prev + '&limit=' + currentLimit + 'rel="prev"');
    links.push(uri + '1&limit=' + currentLimit + 'rel="self"');
    if (next <= last)
        links.push(uri + next + '&limit=' + currentLimit + 'rel="next"');
    links.push(uri + last +'&limit=' + currentLimit + 'rel="last');
    return links;
}

http.createServer(function(req, res) {
    var data = '';
 
    req.on('data', function (chunk) {
        data += chunk;
    });

     if ((id = req.url.match('^/orders$'))) {
        if (req.method == 'GET') {
            res.writeHead(
                200, 
                {
                    'Content-Type': 'text/plain', 
                    "Link": createLinks(1, 5)
                }
            );
            res.end(storage.getOrders(1, 5) + '\n');
        }
        else {
            res.writeHead(400);
            res.end();
        }
    }
    else if ((id = req.url.match('^/orders([?])page([=])([0-9]+)([&])limit([=])([0-9]+)'))) {
        if (req.method == 'GET') {
            var page = id[3],
                limit = id[6];

            res.writeHead(
                200, 
                {
                    'Content-Type': 'text/plain', 
                    "Link": createLinks(page, limit)
                }
            );
            res.end(storage.getOrders(page, limit) + '\n');
        }
        else {
            res.writeHead(400);
            res.end();
        }
    }
    else {
            res.writeHead(404);
            res.end();
        }
}).listen(8080);