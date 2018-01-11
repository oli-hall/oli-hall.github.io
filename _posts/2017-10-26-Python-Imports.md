---
layout: post
title: "<3 Python Imports"
date: 2017-10-26 15:07
categories: posts
comments: true
---

I had some interesting fun with Python imports today. Long story short, I'm developing a Python package, with a series of classes declared in appropriately named modules, each of which is exposed at the package level for easy import elsewhere. Something like this:

```
package
|- __init__.py
|- class_a.py
|- class_z.py
```  


My **__init__.py** looks something like this:

```python
from .class_a import A
from .class_z import Z
```

All fine, no worries. However, I then added a new class, let's call it **B**, that required **Z** as a dependency. That's no issue, create a **class_b.py**, declare **B** in there, and add a **from package import Z**. Done! A quick addition of **from .class_b import B** to **__init__.py** and my new class is exposed at package level. 

# Let the shenanigans commence

I then started using my updated package, and immediately started to get errors about importing **Z**:

```shell_session
In [1]: from package import Z
---------------------------------------------------------------------------
ImportError                               Traceback (most recent call last)
<ipython-input-1-7b646b7ea075> in <module>()
----> 1 from package import Z

<package_dir>/package/__init__.py in <module>()
      1 from .class_a import A
----> 2 from .class_b import B
      3 from .class_z import Z

<package_dir>/package/class_b.py in <module>()
----> 1 from class_z import Z
      2 
      3

ImportError: cannot import name Z
```

That's odd. I added **Z** a while ago, and have been using the package for a while. That class should be fine. Anyhow, I started wondering about whether there was some library caching going on - the package is built as an .egg - and thus the new class hasn't been picked up correctly. I nuked *build* directories, *.egg-info*s, everything. Still no change. Finally, I nuked the virtualenv directory, and as a last resort, deleted the entire local copy of the repository and recloned. Still no change. 

Fortunately, at this point, I had a lucky guess. See, I had run PyCharm's 'Optimize Imports' to organise imports. This had rearranged the imports in my **__init__.py**, so that they were as follows:

```python
from .class_a import A
from .class_b import B
from .class_z import Z
```

However, **B** imports **Z** at the package level. So Python, when evaluating this, tries to import **Z** from the package level _in the process of_ importing **B**, which fails, as it's going line-by-line, and hasn't yet imported **Z**. A quick test was to swap the second and third lines in my **__init__** file. Sure enough, importing **Z** first (which doesn't depend on any other files in the package) made it visible at package level, so that **B** could then import it.

That's not a particularly great permanent solution though - another 'Optimize Imports' could easily nuke it. Instead, I've now ensured that all inter-package imports are explicit e.g. **from package.class_z import Z**, eliminating any ordering constraints between the package level imports. Not a complex bug, but interesting nevertheless!
