# Login workflow with AngularJS

The following is a fully and working login workflow implemented in an AngularJS app. This workflow allows:

* Check if the user is already logged in when the application starts.
* If the user is logged in, navigate to the default route.
* Otherwise, navigate to the login route.
* If the user reloads the application and is already logged in, stay in that view.
* Otherwise, navigate to the login route and after a successful login, redirect the user back to the original view.

The first three items are quite straightforward but the last ones are tricky. So, lets analyze those step by step.

## Running the example

Install the dependencies with `npm-install`, start the server with `npm start` and open a browser in http://localhost:4000. User is `user` and password is `pass`.

Enjoy!

## Setup

On top of `angular` we will needed a routing module: `angular-route`. For this particular implementation, all of them are i versions 1.4. A similar workflow could be developed with `ui-router` or any other AngularJS router but just to keep it simple I used `angular-route`.

## Router configuration

The first step is to confiugure the routes. Given `app` is the main module, `app.config()` shall be called with the configuration function to define the `/login` route that will lead the user to the login view, and the `/main` route, which is the default one too:

```javascript
// main module configuration
app.config(function ($routeProvider) {
    $routeProvider

        // login view definition
        .when("/login", {
            controller: "loginController",
            controllerAs: "vm",
            templateUrl: "path-to/login.html"
        })

        // main app view definition
        .when("/main", {
            controller: "mainController",
            controllerAs: "vm",
            templateUrl: "path-to/main.html"
        })

        // many other routes could be defined here

        // and redirect the user to the main view if no routes match
        .otherwise({
            redirectTo: "/main"
        });
});
```

Many other routes can be defined but the workflow will not change significantly.

## Checking login status

The second step is to check if the user is already logged in or not. This has to be done before the user navigates to any page so we can redirect the app to the login page as needed. Fortunately we have the `$routeChangeStart` event on the `$rootScope`, which is fired before changing views. Therefore, in order to listen for this event right from the start of the app, we shall attach to the `run` method of our main module `app`:

```javascript
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
```

This way, before the router changes the view, we must check if the user is already logged in. As the login status is global to the whole application, we can just store a flag `loggedIn` in the `$rootScope`.

Modifying the `$rootScope` should be avoided due to performance issues, as any change would trigger a cascade of changes throughout the application but in this case just keeping that state there is the right choice.

In the case the user is logged in, we should do nothing. But if the user is not logged in, we must redirect the application to the `/login` view by calling `$location.url()` with the new path.

Finally, and before redirecting the user to `/login`, we must remember where the user attempted to navigate so we can send back there after the login. One solution is to add a querystring parameter `back` to the URL. The controller of the login view will read this parameter and send the user back later.

But what happens if the user is not logged in and is already navigating to `/login`? We must skip the redirection to avoid sending back the user to `/login` after logging in. Nonsense, right?

## The login controller

The third step is to handle the login view itself. The controller will make use of a `loginService` that is in charge of actually contacting the server for authenticate the user. The implementation is out of the scope of the login flow but can be as simple as a couple of `$http.get()` and `$http.post()` with the credentials to the right login API routes.

```javascript
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
```

Right after the view and its controller are instantiated, the `loginService` is used to check if the user is already logged in. In that case, the flag in the `$rootScope` is marked and the user is returned back to the view where it came from. That information was previously recorded in the querystring during the handling of the `$routeChangeStart` event.

In order to avoid looping the user back to the login page, we must skip the redirection if it is equal to `/login`. In that case we simply redirect the user to the blank route that will, in turn, send the user to the default route as configured in the router.

In the case the check is not successful, we must keep the view open to let the user enter its user and password. After doing so, we must call the `loginService` with the credentials and do the same processing on success. On failure, we could show an alert or any message back to the user, which is, again, out of the scope of the login workflow.

## Don't forget the credentials on cross-domain calls!

In the case the application must login against a server in a different domain, the server must be configured to accept CORS requests and all the XHR requests shall be explicitly configured to include the cookies. This shall be done in the main module configuration function:

```javascript
app.config(function ($httpProvider) {

    // routes configuration
    // ...

    // $http configuration to always send back the cookies
    $httpProvider.defaults.withCredentials = true;
}
```

## In summary

There are many examples, questions, blog posts regarding how to implement a login workflow in AngularJS but I found no one that is complete, only pieces here and there.

Nevertheless, the flow is quite simple. It is just a matter of properly configuring the router, listening for route changes, remembering the previous route to send the user back and avoid routing loops.
