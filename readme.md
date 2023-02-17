# inveweb

Insert the purpose of this project and some interesting infos here

## Credits

This project has been generated with 💙 and [easy-ui5](https://github.com/SAP)

## Note
Before we generate the war file for front in eclipse, we need to add undertow-handlers.conf file in webapp/WEB-INF<br/>
undertow-handlers.conf file is a possible solution for some vulnerabilities detected in hardening, This file is not mandatory<br/>
undertow-handlers.conf file contains the following content
<pre>
path('/') -> redirect(/cyclicalinventoriesweb/login.html);

regex('package.json') -> response-code[403]
</pre>
The first rule redirect to login.html when in not in path<br/>
The second rule return a response with code 403 to avoid access to package.json files directly<br/>

## Note Vulnerability "150246 Path-relative stylesheet import (PRSSI) vulnerability"
In login.html and manifest.json files added "/cyclicalinventoriesweb/" to solve this vulneravilty if you need to test your changes in a localhost for VS maybe you need to remove temporaly "/cyclicalinventoriesweb/" in both files.