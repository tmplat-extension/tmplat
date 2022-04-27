# Contributing

Here are some guidelines that we'd like contributors to follow so that we can have a chance of keeping things right.

## Getting Starting

* Make sure you have a [GitHub account](https://github.com/join)
* Submit a ticket for your issue if one does not already exist
  * Clearly describe the issue including steps to reproduce when it is a bug
  * Include the earliest version that you know has the issue
* Fork the repository on GitHub
* Read the `INSTALL.md` file

## Making Changes

* Create a topic branch from where you want to base your work
  * This is usually the master branch
  * Only target release branches if you are certain your fix must be on that branch
  * To quickly create a topic branch based on master;
    `git branch fix/master/my-contribution master` then checkout the new branch with
    `git checkout fix/master/my-contribution`
  * Avoid working directly on the `master` branch
* Make commits of logical units
* Check for unnecessary whitespace with `git diff --check` before committing
* Make sure your commit messages are in the proper format
* Avoid updating the distributable file or annotated source code documentation

```
(#99999) Make the example in CONTRIBUTING imperative and concrete

Without this patch applied the example commit message in the CONTRIBUTING document is not a concrete example. This is a
problem because the contributor is left to imagine what the commit message should look like based on a description
rather than an example. This patch fixes the problem by making the example concrete and imperative.

The first line is a real life imperative statement with a ticket number from our issue tracker. The body describes the
behavior without the patch, why this is a problem, and how the patch fixes the problem when applied.
```

## Submitting Changes

* Ensure you added your details to `AUTHORS.md` in the correct format
  `Joe Bloggs <joe.bloggs@example.com>`
* Push your changes to a topic branch in your fork of the repository
* Submit a pull request to tmplat's repository
* Update your issue to mark that you have submitted code and are ready for it to be reviewed
  * Include a link to the pull request in the issue

# Additional Resources

* [Repository](https://github.com/tmplat-extension/tmplat)
* [Issue tracker](https://github.com/tmplat-extension/tmplat/issues)
* [General GitHub documentation](https://help.github.com)
* [GitHub pull request documentation](https://help.github.com/send-pull-requests)
