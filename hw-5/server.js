var http = require('http');
var crypto = require("crypto");

var storage = {
    customers : [],
    id : 1,
    lastModify: new Date().getTime(),
 
    addCustomer: function(name) {
        var customer = {
                    id : this.getCustomerSeqId(),
                    name : name,
                    orders: []
                };
        this.customers.push(customer);
        this.lastModify = new Date().getTime();
    },
 
    getCustomer: function(customerId) {
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].id == customerId)
                return this.customers[i];
        return null;
    },

    getCustomersList: function() {
        var output = '';
        this.customers.forEach(function(c) {
            output += 'Customer: ' + c.id + ' ' + c.name + ' ' + JSON.stringify(c.orders) + '\n';
        });
        return output;
    },

    addCustomersOrder: function(customerId, order) {
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].id == customerId)
                this.customers[i].orders.push(order);
        this.lastModify = new Date().getTime();
    },

    changeCustomersName: function(customerId, name) {
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].id == customerId)
                this.customers[i].name = name;
        this.lastModify = new Date().getTime();
    },
 
    getCustomerSeqId: function() {
        return this.id++;
    }
};

function computeWeakETag() {
    var content = '';
    storage.customers.forEach(function(c) {
        content += c.id + c.name;
    });
    return crypto.createHash('md5').update(content).digest('hex');
}

function computeStrongETag() {
    return crypto.createHash('md5').update(JSON.stringify(storage.customers)).digest('hex');
}

storage.addCustomer('Bob');
storage.addCustomer('Alice');

http.createServer(function(req, res) {
    var data = '';
 
    req.on('data', function (chunk) {
        data += chunk;
    });
 
    //add customer on POST method
    if ((id = req.url.match('^/customer$'))) {
        if (req.method == "GET") {

            var strongETag = computeStrongETag();
            var weakETag = '"W/' + computeWeakETag() + '"';
            var eTags = req.headers["if-none-match"] ? req.headers["if-none-match"].split(',').map( i => i.trim().slice(1, -1)) : null;
            var date = req.headers["if-modified-since"];

            if ( (eTags && eTags.some( i => {return i === weakETag || i === strongETag})) || date >= storage.lastModify ){
                res.writeHead(304, {'Last-Modified' : storage.lastModify, 'ETag' : strongETag + ', ' + weakETag});
                res.end();
            }

            res.writeHead(200, {'Last-Modified' : storage.lastModify, 'ETag' : strongETag + ', ' + weakETag});
            res.end(storage.getCustomersList());
        }
        if (req.method == "POST") {
            req.on('end', function () {
                var input = JSON.parse(data);
                storage.addCustomer(input.name);
                res.writeHead(201, {'Location': '/customer/' + customer.id});
                res.end('Customer: ' + customer.id + ' ' + customer.name + '\n');
            });
        }
        else {
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end('Method Not Allowed');
        }
    }

    if ((id = req.url.match('^/customer/([0-9]+)$'))) {
        if (req.method == 'POST') {
            req.on('end', function () {
                var order = JSON.parse(data);
                storage.addCustomersOrder(id[1], order);
                res.writeHead(201, {'Content-Type': 'text/plain'});
                res.end('Created' + '\n');
            });
        }
        if (req.method == "PUT") {
            req.on('end', function () {
                var input = JSON.parse(data);
                if (input.name) {
                    storage.changeCustomersName(id[1], input.name);
                    res.writeHead(201, {'Content-Type': 'text/plain'});
                    res.end('Changed' + '\n');
                } else
                res.writeHead(400);
            });
 
        }
 
    }
 
}).listen(8080);