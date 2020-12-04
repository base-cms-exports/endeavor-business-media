# BaseCMS Websites for Endeavor Business Media
This monorepo contains the codebase for export managed by Endeavor Business Media. All tenants/sites within this repository utilize the [@base-cms/base-cms](https://github.com/base-cms/base-cms) packages, most notably the `export-framework` and `web-cli`.

#### Copy Method
If you wish to use an existing site as a starting point,begin by creating a new branch and then copy the site directory (recursively) to the new site name:
```bash
cp -R tenants/sitetocopy tenants/mynewsite
```

This is a good time for the first commit, as you can then commit each change below individually (helps with code review later).

Next, update the following files:
```diff
# /docker-compose.yml
# Be sure to increment ports to unused values
+  my-new-site:
+    <<: *node
+    <<: *export-cmd
+    working_dir: /root/tenants/mynewsite
+    environment:
+      <<: *env
+      <<: *env-clustername
+      PORT: 80
+      EXPOSED_PORT: 9711
+      LIVERELOAD_PORT: 19711
+      TENANT_KEY: mynewsite_key
+      AWS_ACCESS_KEY: ${AWS_ACCESS_KEY}
+      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
+    ports:
+      - "9711:80"
+      - "19711:19711"
```

```diff
# /tenants/mynewsite/package.json
-  "name": "@endeavor-business-media/sitetocopy",
+  "name": "@endeavor-business-media/mynewsite",
-  "author": "John Doe <johndoe@gmail.com>",
+  "author": "Jack Smith <jacksmith@gmail.com>",
-  "repository": "https://github.com/base-cms-websites/your-repository/tree/master/sites/sitetocopy",
+  "repository": "https://github.com/base-cms-websites/your-repository/tree/master/sites/mynewsite",
```

When copying sites, ensure that unused sites & exports are not copied inadvertently.
