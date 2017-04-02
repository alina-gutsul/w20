var http = require('http');

var storage = {
    customers : [],
    id : 1,
    deleteQueries: [],
 
    addCustomer: function(customer) {
        this.customers.push(customer);
    },
 
    getCustomer: function(customerId) {
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].id == customerId)
                return this.customers[i];
        return null;
    },

    deleteCustomer: function(customerId) {
        for (var i = 0; i < this.customers.length; i++)
            if (this.customers[i].id == customerId)
                delete this.customers[i];
        this.changeQueryState(customerId);
    },

    getCustomersList: function() {
        var output = '';
        this.customers.forEach(function(c) {
            output += 'Customer: ' + c.id + ' ' + c.name + '\n';
        });

        return output;

    },
 
    getCustomerSeqId: function() {
        return this.id++;
    },

    addDeleteQuery: function(customerId) {
        this.deleteQueries.push({
            custId: customerId,
            state: 'process'
        });
    },

    getDeleteQueryState: function(customerId) {
        for (var i = 0; i < this.deleteQueries.length; i++)
            if (this.deleteQueries[i].custId == customerId)
                return 'Customer id: ' + this.deleteQueries[i].custId + '. State ' + this.deleteQueries[i].state + '\n';
        return null;
    },

    changeQueryState: function(customerId) {
        for (var i = 0; i < this.deleteQueries.length; i++)
            if (this.deleteQueries[i].custId == customerId)
                this.deleteQueries[i].state = 'processed';
    }
};

http.createServer(function(req, res) {
    var data = '';
 
    req.on('data', function (chunk) {
        data += chunk;
    });
 
    //add customer on POST method
    if ((id = req.url.match('^/customer$'))) {
        if (req.method == "GET") {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(storage.getCustomersList());
        }
        if (req.method == "POST") {
            req.on('end', function () {
                var input = JSON.parse(data);
                var customer = {
                    id : storage.getCustomerSeqId(),
                    name : input.name
                };
                storage.addCustomer(customer);

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
        if (req.method == 'DELETE') {
                var customer = storage.getCustomer(id[1]);
                if (customer) {
                    storage.addDeleteQuery(customer.id);
                    res.writeHead(202, {'Location': '/confirm/' + customer.id});
                    res.end('Please confirm... \n');
                }
                else 
                    res.writeHead(400);
        }
    }

    if ((id = req.url.match('^/confirm/([0-9]+)$'))) {
        var query = storage.getDeleteQueryState(id[1]);
        if (req.method == 'GET') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(query);
        }
        if (req.method == 'POST') {
            if (query) {
                storage.deleteCustomer(id[1]);
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Customer was deleted. \n');
            }
            else 
                res.writeHead(400);
        }
    }
 
}).listen(8080);