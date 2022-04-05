# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.7.0](https://github.com/guaranijs/guarani/compare/v0.6.1...v0.7.0) (2022-04-05)


### Bug Fixes

* **jose:** Added missing JWT exports. ([83d0d2b](https://github.com/guaranijs/guarani/commit/83d0d2b644644a6c420d733922b123a40902717d))
* **jose:** Added missing types exports. ([1caea3d](https://github.com/guaranijs/guarani/commit/1caea3dc0e136c0ec144ff2fea43da6b2ea9887c))
* **jose:** Fixed JWK "kty" parameter. ([4b5e0fa](https://github.com/guaranijs/guarani/commit/4b5e0fa75a43924aa625f48fda70adf32ea08bee))
* **oauth2:** token endpoint was missing its name. ([79f7298](https://github.com/guaranijs/guarani/commit/79f72989adcb39780999ff96640bd0ba46d4af87))


### Features

* **ioc:** added lifecycle to the bindings. ([1f90bbd](https://github.com/guaranijs/guarani/commit/1f90bbd84218205cdf843e5880d50c4d549094d6))
* **ioc:** Added support for static property injection. ([832915f](https://github.com/guaranijs/guarani/commit/832915f088f3a3c6a795df897a4e17e0c5213449))
* **jose:** Added JsonWebToken.isJWT() method. ([974993d](https://github.com/guaranijs/guarani/commit/974993da8db10042a3d6bc61b7d7e9eacb090335))
* **oauth2:** Added support for RFC 7523 and its OpenID Connect profiles. ([55041fa](https://github.com/guaranijs/guarani/commit/55041fa156c11509a89c1c32b8526c5b5b97b705))
* **oauth2:** Changed the Authorization and Token flows from their endpoints to their respective abstract class. ([e7b33af](https://github.com/guaranijs/guarani/commit/e7b33afc4eea55ddeecdb966e1cf747990c65961))
* **oauth2:** Changed the Authorization and Token flows from their endpoints to their respective abstract class. ([4a5c6cf](https://github.com/guaranijs/guarani/commit/4a5c6cf704ce81e396337df0347e46b9d5b24cea))





## [0.6.1](https://github.com/guaranijs/guarani/compare/v0.6.0...v0.6.1) (2021-09-08)


### Bug Fixes

* **oauth2:** Fixed required Authorization Parameters. ([3c9ea0d](https://github.com/guaranijs/guarani/commit/3c9ea0dc7070dda194c77c930e5c11fc36d5ffa2))
* **oauth2:** User Consent checks its request parameters. ([1c05fa7](https://github.com/guaranijs/guarani/commit/1c05fa705cb5cf797ec1055357e95fde6f6616e4))





# [0.6.0](https://github.com/guaranijs/guarani/compare/v0.5.0...v0.6.0) (2021-09-08)


### Bug Fixes

* **oauth2:** Added default Grants. ([e575460](https://github.com/guaranijs/guarani/commit/e575460fe419a6b39f3938a55db39332916e8761))
* **oauth2:** Authorization Server's Error Url is now dynamic. ([fa1410e](https://github.com/guaranijs/guarani/commit/fa1410e5be5a2ccbef4ae6d4a1bd736f97262ac1))


### Features

* **ioc:** Refactored the imports of @guarani/utils and changed Container to getContainer(). ([c41cc95](https://github.com/guaranijs/guarani/commit/c41cc9527c5cfb1f144c3a019a7afd3c478d7746))
* **oauth2:** Added Client Authentication Method restriction at the ClientAuthenticator. ([7ff4aa0](https://github.com/guaranijs/guarani/commit/7ff4aa0009704a1c26ccacf5fa0a5247c28fb174))
* **oauth2:** Added Revocation Endpoint. ([e1a3e23](https://github.com/guaranijs/guarani/commit/e1a3e237c9fa13d22db78a3f918a7518180a9efd))
* **oauth2:** Added support for RFC 8707. ([1b5d49c](https://github.com/guaranijs/guarani/commit/1b5d49c147e36ba1ee2eb939bf700478a885c9b3))
* **oauth2:** Added the Introspection Endpoint. ([d9d262a](https://github.com/guaranijs/guarani/commit/d9d262a0587b61392df06477f7011cced765f106))
* **oauth2:** Added User Consent functionality. ([627da3e](https://github.com/guaranijs/guarani/commit/627da3e000f1812a1557a11c3cffaa4ba5255ffe))
* **oauth2:** Refactored the code and made Refresh Token Rotation mandatory. ([fe666cc](https://github.com/guaranijs/guarani/commit/fe666cc8da2b1748c70f7d2d0f41a56fe1e8ae2b))
* **utils:** Added Nullable type. ([ca6a644](https://github.com/guaranijs/guarani/commit/ca6a644e0ba6bf09f11559a79d4cf1a85a368760))





# [0.5.0](https://github.com/guaranijs/guarani/compare/v0.4.0...v0.5.0) (2021-06-19)


### Features

* **jose:** Added JWE Compression Algorithms. ([20952ea](https://github.com/guaranijs/guarani/commit/20952ea9d3676b2ab9146b6233b83dda9ceb21af))
* **jose:** Added JWE Features. ([e9bde78](https://github.com/guaranijs/guarani/commit/e9bde786b3e4d27580d3f95a6d8c0fe5651b10b7))
* **jose:** Added JWT Features. ([63657b1](https://github.com/guaranijs/guarani/commit/63657b16e32aa5d7863488785a48ed80904cafdc))
* **utils:** Added OneOrMany type. ([7b15245](https://github.com/guaranijs/guarani/commit/7b152454d9925de80763beb655b8830ed216f5d4))





# [0.4.0](https://github.com/guaranijs/guarani/compare/v0.3.0...v0.4.0) (2021-05-28)


### Features

* **ioc:** Added Inversion of Control Dependency Injection library. ([e4a2a6b](https://github.com/guaranijs/guarani/commit/e4a2a6be2861becaf274523677c6b6de39b7cdc7))
* **ioc:** Added property injection. ([7508e3a](https://github.com/guaranijs/guarani/commit/7508e3aba97e2012340b00280298150b9b973246))
* **oauth2:** Added the basic Authorization Server functionalities. ([ad5539f](https://github.com/guaranijs/guarani/commit/ad5539f19e3c2097218fa75a997f37dec1f500f2))
* **utils:** Added custom types, random string generator and a HTML sanitizer. ([08adf1d](https://github.com/guaranijs/guarani/commit/08adf1d47f927f60f9cb9dc2ef208e67a9569396))





# [0.3.0](https://github.com/guaranijs/guarani/compare/v0.2.0...v0.3.0) (2021-03-20)


### Features

* Added the JSON Web Token functionalities. ([cec1ecd](https://github.com/guaranijs/guarani/commit/cec1ecd08e0d4271a5c9a9f2a08c0dac7dc985e7))
* **utils:** Added deep comparison between objects. ([c882e0e](https://github.com/guaranijs/guarani/commit/c882e0e64854d0c56ae37ea69bcf8e895a061d3d))





# [0.2.0](https://github.com/guaranijs/guarani/compare/v0.1.0...v0.2.0) (2021-03-19)


### Features

* Added JSON Web Signature. ([9b63232](https://github.com/guaranijs/guarani/commit/9b63232ff33d558ce27c9136d872cbec9db3fe23))
