---
layout: post
title: "Python Mutable Defaults"
date: 2018-05-31 17:55
categories: posts
comments: true
---

It's been too long, but I did _finally_ get around to writing this post. A while back, I was debugging a function, and getting the darndest results. Basically, my function was trying to build up a set of imports in a given module, and worked by initially taking an empty set, and then building up a set of imported files, and returning it (yes, I was deep in 'Python magic' land). Something akin to this:

```python
def find_imports(module_name, files=set()):
    if module_name in files:
        return set()
    
    files.add(module_name)
    return files
```

There was a bunch more to this function originally (including some tasty recursion), but I'd noticed that the function seemed to be stateful somehow - the list of files was being preserved across calls:

```python
> print(find_imports('foo'))
set(['foo'])
> print(find_imports('foo'))
set([])
```

It was looking increasingly like the `files` set was being shared across the calls to the function. This made little sense, and indeed I threw this at a couple of friends, with similar head-scratching results, until we had a brainwave: mutable defaults!

[This page](https://docs.quantifiedcode.com/python-anti-patterns/correctness/mutable_default_value_as_argument.html) explains in more detail, but the crux of the problem is that default arg to `files` - it's a mutable object. I was doing this so that the starting call could be `find_imports('name')`, then subsequent nested calls could pass in the files found so far: `find_imports('nested_name', files)`. However, if you set a mutable default value for an argument, you end up in the situation I was in, as Python creates the default value when the function is created, not when it's used, i.e. there's only one value, shared across all instances of the function. Not what was desired here at all!

The fix is fairly simple, set the default to `None` or some similar placeholder value, then check for `None` in the function, and instantiate the correct default value there:

```python
def find_imports(module_name, files=None):
    if files is None:
        files = []

    # ... continue as normal
```

This was a fairly simple issue, with a neat explanation, that nevertheless tripped me up for a good while. What's more, [PyCharm](https://www.jetbrains.com/pycharm/) even highlights issues like these with warnings, but I foolishly ignored it - to my detriment! That'll teach me to learn more about warnings I don't fully understand...

As an aside, the [Python Anti-patterns page](https://docs.quantifiedcode.com/python-anti-patterns/index.html) linked above is an excellent read if you have some time to spare. There's a fair chance you'll have seen some/most of them before, but if it saves you from even one, it's probably worth it!
