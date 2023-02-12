# OAuth 2.0 Authorization Server

The OAuth 2.0 Authorization Server allows a web application to provide Authorization and Authentication to Clients based on the OAuth 2.0 Specification and its profiles OpenID Connect and User-Managed Access 2.0.

## Integrations

This package is an implementation of the OAuth 2.0 Authorization Server in NodeJS + Typescript. It provides multiple layers of abstraction for various methods of integration with different frameworks, as well as different levels of control over the OAuth 2.0 Authorization Process.

### Middlewares

The highest level of integration comes in the form of Middlewares for the various web frameworks of NodeJS. These middlewares only need a Configuration object and the implementation of the necessary Services.

The currently implemented Middlewares are:

- [x] ExpressJS

### Providers

The next level of integration comes in the form of Providers.

A Provider is an implementation of the [AuthorizationServer](src/lib/authorization-server/authorization-server.ts) abstract class for the various web frameworks of NodeJS. It has helper methods for creating [OAuth 2.0 Requests](src/lib/http/request.ts) based on the request object of the web framework and for parsing an [OAuth 2.0 Response](src/lib/http/response.ts) into the response object of the web framework. It can also provide custom properties or methods for the specific web framework, such as the ExpressJS Router in the [ExpressProvider](src/lib/integration/express/express.provider.ts).

Providers need to be decorated with the [AuthorizationServerMetadata](src/lib/metadata/authorization-server-metadata.ts) decorator.

The currently implemented Providers are:

- [x] ExpressJS

### Authorization Server Abstract Class

The next level of integration is represented by the [AuthorizationServer](src/lib/authorization-server/authorization-server.ts). It provides the barebones structure for a functioning implementation of the OAuth 2.0 Authorization Server by exposing the endpoints injected during its creation.

The `AuthorizationServer` class needs to be decorated with the [AuthorizationServerMetadata](src/lib/metadata/authorization-server-metadata.ts) decorator. This decorator receives an object containing the Configuration of the OAuth 2.0 Authorization Server and injects their implementations into the created instance.

### Low level implementations

The last level of integration is defined as using the low-level implementations directly into your code.

Venturing into this level is a double-edged sword, since, on one hand, it provides a high level of freedom for customizing the behaviour of the OAuth 2.0 Authorization Server, but, on the other hand, it also means that there is a lot of room for misconfiguration, logic breaks and overall effort to put together all the pieces of the OAuth 2.0 Specification into one cohesive deployment.
