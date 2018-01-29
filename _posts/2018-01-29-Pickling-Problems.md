---
layout: post
title: "Pickling Problems"
date: 2018-01-29 16:50
categories: posts
comments: true

---

If you've worked with [PySpark](https://spark.apache.org/docs/latest/api/python/) for a while, you'll likely have encountered, for better or worse, [pickle](https://docs.python.org/2/library/pickle.html). `pickle` is a Python serialization library used for converting Python objects to and from bytes. PySpark uses it extensively when packaging up code and sending it too and fro between driver and executors. For the most part, it works seemlessly, but every now and again, it all goes a bit pear-shaped.

Anyhow, when running an `RDD.map`, we came across the following error:

```python
TypeError: can't pickle dict_keys objects
```

Which was being thrown from a piece of Spark code doing more-or-less the following:

```python
r = MyClass()
rdd.map(lambda x: r.extract_fields(x))
```

This caused a lot of head scratching, as this code was previously tested on a very similar class, and had zero issues. Unfortunately, the good ol' faithful Google-search proved fruitless, until I came across [this post](https://cmry.github.io/notes/picklepy3), by _cmry_ (it's not a long read, I'll wait). 

tl;dr - `pickle`, understandably, doesn't like generators. And it turns out, in Python3, the `<dict>.keys()` method no longer returns a list, but a generator. Sure enough, a quick search reveals that the class in question has the following:

```python
class MyClass(SuperClass):
    
    CONFIG = {
        "key": "value",
        ...
    }

    def __init__(self):
        super(MyClass, self).__init__(
            config_keys=CONFIG.keys()
        )

    ...
```

[Bingo!](https://i.makeagif.com/media/3-24-2016/K34NIW.gif) That call to `keys()` in the superclass constructor is a generator in Python3. Sneaky, and surprisingly easy to miss, coming from a Python 2 background.  
