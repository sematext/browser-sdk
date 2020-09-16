# Sematext Browser SDK
Repository containing the Browser SDK for the [Semtext Experience](https://sematext.com/experience/). It is used to collect end-user data from browsers using various APIs and is designed to work for traditional web applications as well as single-paged ones. The collected data includes:

 - Page load metrics,
 - HTTP requests metrics,
 - Page resources metrics,
 - [Long tasks metrics](https://sematext.com/docs/experience/longtasks/),
 - [Web Vitals metrics](https://sematext.com/docs/experience/webvitals/),
 - [Element timing metrics](https://sematext.com/docs/experience/element-timing/),
 - [User metrics](https://sematext.com/docs/experience/user-identification/),
 - [On-page transaction metrics](https://sematext.com/docs/experience/on-page-transaction/).

![Sematext Cloud Experience](docs/images/sematext_cloud_experience_overview.png) 

## Development

There are two parts to this script: the script itself, and the small loader
script. 

The loader script will actually add the `<script>` tags for loading the
RUM script and will keep track of any commands send to the script while it was
still loading. When the RUM script finally loads it will read any pending
commands and execute them.

**Please note that the loader and rum script depend on each other, and that
before changing the scripts you should keep in mind that website
developer who have already added the script to their website will use the older
loader script.**

### Working on the RUM script

Start by looking at `src/index.js`. Use `eslint` to catch any style issues and
Flow to catch any type errors, and use the following commands:

 - `yarn run start` to start the development server
 - `yarn run lint` to lint the code
 - `yarn run flow` to run Flow type checks
 - `yarn run build` to build the production bundle
 - `yarn run dev` to build the development (not minified) bundle

### Working on the loader script

Start by looking at `src/snippet.js`. This is the unminified es2015 version of
the loader script. To generate the minified snippet for use `yarn run generate-snippet`.

**Keep in mind that the loader script should be compact.**

### Manual Tests

You can test the loader and rum script using one of the ***test*** websites that are provided:

 - `test.html` - simple app that can be used to generate page load events and HTTP requests 
 - `testspa.html` - simple single-page app used to generate `routeChange` events and HTTP requests 
 - `large.html` - app used for testing large requests from RUM script
 - `e2e.html` - app used for most of the integration tests 

Run `yarn run start` to run a small test website which will be running the dev
version of the rum script. After making changes to the script, reload the
website to see the changes. 

If you wish to automatically test single page applications there is a second test application
called `spa.html` (ses `testspa.html` file) which you start by running `yarn run start`. It 
automatically runs `routeChange` commands every 10 seconds and HTTP requests every 5 seconds.

### Automatic Tests

[Cypress.io](https://www.cypress.io) is used for automatic testing. The integration
tests are included in the `cypress/integration/` directory and cover all the crucial
features of the script itself. The tests are using the same set of HTML files used 
by the manual tests.  

To run the full set of tests run `yarn e2e`. The results will include a table with test
results similar to the following one:

```
     Spec                                              Tests  Passing  Failing  Pending  Skipped
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✔  buffer.spec.js                           00:10        1        1        -        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✔  elementtiming.spec.js                    00:46        3        3        -        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✔  integration.spec.js                      00:15        4        4        -        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✖  large.spec.js                            00:05        1        -        1        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✔  longtask.spec.js                         00:30        2        2        -        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✔  transactions.spec.js                     00:15        1        1        -        -        - │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ✔  web-vitals.spec.js                       00:10        1        1        -        -        - │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
  ✖  1 of 7 failed (14%)                      02:15       13       12        1        -        -
```

## Sending data to multiple receivers 

In order to configure the script to send data to multiple rum receivers you
need to add the rum snippet multiple times. Only the first snippet should have
URL to the RUM script set so that it's loaded only once, for example:

```html
<script type="text/javascript">
  ...
  INSERT SCRIPT SNIPPET HERE
  ...
  (window,document,"script","/rum.js","strumTest");
</script>
<script type="text/javascript">
  ...
  INSERT SCRIPT SNIPPET HERE
  ...
  (window,document,"script",null,"strumUS");
</script>

<script type="text/javascript">
  window.STRUM_CONTEXTS = ['strumTest', 'strumUS'];
  var receivers = [
    'https://rum-receiver.test.sematext.com',
    'https://rum-receiver.sematext.com',
  ]
  strumTest('config', {
    token: 'b12s3ssd-d11s-2d39-7231-f3s22grd635f',
    receiverUrl: receivers[0],
    ignoreOrigins: receivers,
  });
  strumUS('config', {
    token: '8763d12d-1j3t-932v-b498-544290z98k43',
    receiverUrl: receivers[1],
    ignoreOrigins: receivers,
  });
</script>
```

## Contributing

Pull requests for bug fixes, improvements and new features are more than welcome. When opening a new pull request please take the time to briefly describe the changes. Make sure that the newly introduced code passes the `lint` and `flow` checks along with the integration tests. Once the PR is submitted Sematext will review and merge your changes.