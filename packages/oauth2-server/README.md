# OAuth 2.0 Authorization Server

The OAuth 2.0 Authorization Server allows a web application to provide Authorization and Authentication to Clients based on the OAuth 2.0 Specification and its profiles OpenID Connect and User-Managed Access 2.0.

## Integrations

This package is an implementation of the OAuth 2.0 Authorization Server in NodeJS + Typescript. It provides multiple layers of abstraction for various methods of integration with different frameworks, as well as different levels of control over the OAuth 2.0 Authorization Process.

### Middlewares

The highest level of integration comes in the form of Middlewares for the various web frameworks of NodeJS. These middlewares only need a Configuration object and the implementation of the necessary Services.

The currently implemented Middlewares are:

- [x] ExpressJS

### Backends

The next level of integration comes in the form of Backends.

A Backend is an extension of the [AuthorizationServer](src/lib/authorization-server.ts) class for the various web frameworks of NodeJS. It has helper methods for creating [OAuth 2.0 Requests](src/lib/http/http.request.ts) based on the request object of the web framework and for parsing an [OAuth 2.0 Response](src/lib/http/http.response.ts) into the response object of the web framework. It can also provide custom properties or methods for the specific web framework, such as the ExpressJS Router in the [ExpressBackend](src/lib/backends/express/express.backend.ts).

Providers need to be created with an [AuthorizationServerOptions](src/lib/metadata/authorization-server.options.ts) object.

The currently implemented Backends are:

- [x] ExpressJS

### Authorization Server Class

The next level of integration is represented by the [AuthorizationServer](src/lib/authorization-server.ts). It provides the barebones structure for a functioning implementation of the OAuth 2.0 Authorization Server by exposing the endpoints injected during its creation.

The `AuthorizationServerFactory` uses an implementation of the `AuthorizationServer` class to create an instance of the Authorization Server. The method [AuthorizationServerFactory.create()](src/lib/metadata/authorization-server.factory.ts#L85) needs to be supplied with an [AuthorizationServerOptions](src/lib/metadata/authorization-server.options.ts) object that defines the configuration parameters of the Authorization Server instance.

### Low level implementations

The last level of integration is defined as using the low-level implementations directly into your code.

Venturing into this level is a double-edged sword, since, on one hand, it provides a high level of freedom for customizing the behaviour of the Authorization Server, but, on the other hand, it also means that there is a lot of room for misconfiguration, logic breaks and overall effort to put together all the pieces of the OAuth 2.0 Specification into one cohesive deployment.
