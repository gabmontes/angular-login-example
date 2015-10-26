var app = angular.module("loginTest", ["ngRoute"]);

app.config(function ($routeProvider) {
    $routeProvider
        // login view definition
        .when("/login", {
            controller: "loginController",
            controllerAs: "vm",
            templateUrl: "login.html"
        })
        // main app view definition
        .when("/main", {
            // controller: "mainController",
            // controllerAs: "vm",
            templateUrl: "main.html"
        })
        // many other routes could be defined here
        // and redirect the user to the main view if no routes match
        .otherwise({
            redirectTo: "/main"
        });
});

// execute this function when the main module finishes loading
app.run(function ($rootScope, $location) {
    // attach to the event that fires before the router changes routes
    $rootScope.$on("$routeChangeStart", function (event, next) {
        // check current login status and filter out if navigating to login
        if (!$rootScope.loggedIn && next.originalPath !== "/login") {
            // remember the original url
            $location.url("/login?back=" + $location.url());
        }
    });
});

app.service("loginService", function ($http) {
    return {
        checkLogin: function () {
            return $http.get("/me").then(function (response) {
                return response.data;
            });
        },
        login: function (user, pass) {
            return $http.post("/login", {
                user: user,
                pass: pass
            }).then(function (response) {
                return response.data;
            }, function (response) {
                var err = new Error(response.statusText);
                err.code = response.status;
                throw err;
            });
        }
    };
});

app.controller("loginController", function ($rootScope, $location, loginService) {
    var vm = this;

    function success() {
        $rootScope.loggedIn = true;

        var back = $location.search().back || "";
        $location.url(back !== "/login" ? back : "");
    }

    function failure() {
        $rootScope.loggedIn = false;
    }

    loginService.checkLogin().then(success);

    vm.login = function () {
        loginService.login(vm.user, vm.pass).then(success, failure);
    };
});
