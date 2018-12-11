---
layout: post
title: "Data Engineering"
date: 2018-12-10 10:57
categories: posts
comments: true
---

TODO links

# A (not so brief) introduction to Data Engineering

As part of my handover whilst leaving my job, I was asked to explain the basics of Data Engineering, as my departure would be leaving the team without anyone with that skillset. I gave a workshop/talk, and wrote up notes for that to keep around in case anyone forgot the finer details. The notes may've got a bit out of hand, as I found myself at the tail-end of a 19 page document! Anyhow, I figured since it's not proprietary, I should probably share it here as well, which should force me to remove at least some of the mistakes. I've been playing around with Spark and Hadoop for 4-5 years, and GCP for around 2, but I'm by no means an expert - so there may be the odd error here and there!

## But first... a history lesson

The processing of large amounts of data has been done for almost as long as there have been computers, but really kicked into another gear in the internet era, as there started being a number of very fast-growing companies wanting to perform a lot of computation, as well as compute hitting a price-point where such computations became realistic. High amongst these companies was Google, who came up with the MapReduce paradigm for spreading large computations across many many machines (this is one of the reasons why [Jeff Dean is so reknowned](https://www.newyorker.com/magazine/2018/12/10/the-friendship-that-made-google-huge)). Whilst initially proprietary, Google published a few papers describing their techniques, which got picked up by some open-source devs and turned into Apache Nutch, which then morphed into [Apache Hadoop](https://hadoop.apache.org/). Hadoop consists of four core projects (including MapReduce), and a whole host of related projects which have grown up around it in the intervening years.

### The Hadoop ecosystem

Hadoop has grown to be a vast collection of open-source projects centred around distributed processing and storage of data. The core project consists of 4 main projects:
 - Hadoop Common: A collection of libraries to support other Hadoop modules
 - Hadoop Distributed FileSystem (HDFS): A distributed filesystem to store large amounts of data across a cluster of standard computing machines
 - Hadoop YARN: A framework to manage compute resources in a cluster, and schedule applications
 - Hadoop MapReduce: you should hopefully recognise this bit!

It's since expanded to cover a bunch of other related open-source frameworks built upon/around the Hadoop ecosystem, including (this list shamelessly stolen from the [wiki page for Hadoop](https://en.wikipedia.org/wiki/Apache_Hadoop), though I have used a few of these):
 - [Pig](https://en.wikipedia.org/wiki/Apache_Pig) - high-level framework for running Hadoop jobs, using an SQL-like language known as Pig Latin
 - [Hive](https://en.wikipedia.org/wiki/Apache_Hive) - distributed data warehousing framework to give an SQL-like interface over Hadoop
 - [HBase](https://en.wikipedia.org/wiki/Apache_HBase) - distributed non-relational Database with an SQL-like interface
 - [Phoenix](https://en.wikipedia.org/wiki/Apache_HBase) - highly distributed, highly parallel relational database built on HBase
 - [Spark](https://en.wikipedia.org/wiki/Apache_ZooKeeper) - distributed data processing framework
 - [ZooKeeper](https://en.wikipedia.org/wiki/Apache_ZooKeeper) - distributed consensus framework (amongst other things)
 - [Impala](https://en.wikipedia.org/wiki/Apache_Impala) - SQL query engine built over Hadoop
 - [Flume](https://en.wikipedia.org/wiki/Apache_Flume) - distributed log-processing framework
 - [Sqoop](https://en.wikipedia.org/wiki/Sqoop) - CLI tool for transferring data between relational DBs and Hadoop
 - [Oozie](https://en.wikipedia.org/wiki/Storm_(event_processor)) - workflow scheduling system for Hadoop jobs
 - [Storm](https://en.wikipedia.org/wiki/Storm_(event_processor)) - distributed stream-based processing

### How it works

![MapReduce WordCount example]({{ "images/MapReduce.png" | absolute_url }})

### Data Structure 

Hadoop deals with data as key-value pairs - that is, each piece of data is stored as a key (a way of identifying it), and a value (the data itself). The keys are used to allocate data across many machines, as well as for filtering, sorting, and reducing. More on that next!

### Map

Map is the first of the two phases of a MapReduce job (I know, right... who’d’ve guessed?). Each instance of a Map task takes a single piece of input data and outputs zero or more key-value pairs of data. The simplest example would be counting (see diagram above) - the mapper would read in each input datum, and output it with a value of 1.

### Reduce

Reduce is the second of the two main phases. Each Reducer instance takes a key and a set of values, and outputs a single key and value. This phase can be thought of as ‘gathering’ or ‘reducing’ (see what I did there?) the mapped data from the first phase. In the counting example above, each reducer would process a single key and the individual counts (which here would all be one), summing the counts, thus yielding how many of each key there were.

### Persisting Data

One key point to note about MapReduce is how it persists data. One of the problems with large scale distributed processing (aside from parallelising the whole mess) is dealing with failures. As you increase the number of machines, the chance of one of them failing in some way also increases. To get around that, M/R persists the data from each mapper and reducer (and some intermediate stages) to disk between each operation. This slows things down, but means that once that Mapper has completed, it shouldn’t need re-running. That means if Mappers 1-999 complete, but Mapper #1000 fails, you only need to rerun #1000, and not the other 999. There’s a bit more involved than this (tl;dr distributed things are _haaaard_), but this gives an idea of how the resilience works.

Data is usually persisted in a way that reflects the most common usage of data, so that when queried, it can be processed by nearby machines (or even the same machine, if machines are used for both storage and processing). This is known as data locality, and can reduce job times massively if the data storage reflects how the job is querying it, as all of the data used by the job doesn't need to be copied across the network to other machines in the cluster.

Another important aspect to cover is the shuffling/sorting - the components that determine which data ends up on which reducer, and that try and balance data across the different nodes. This is an important aspect of MapReduce, and feeds into Spark as well. When running a job, you control a lot of different levers, from the number of mappers and reducers to the scheme used to allocate keys to each mapper, and how records are shuffled and sorted.

You can, for example, choose to have a single reducer, in which case all records will be moved to a single reducer instance on a single machine, which can make combining all the records easier (but if you’ve got a lot of data to reduce, this could become a bottleneck). It all depends on how the data is split across the nodes, and how the map/reduce functions affect that.

You could have a map function that, for most keys, doesn’t do much, but for certain keys, produces loads of records. This means that, even if your input data is distributed evenly, the data out of your map phase will all be on one node, making that node a bottleneck, both for speed and potential failure (all the important work is done by a single node, so if it fails, everything needs redoing).

Essentially, writing MapReduce jobs often becomes a tuning/tweaking exercise, balancing data across nodes in all the phases so no one phase takes too long, that all mappers/reducers do similar amounts of work, that shuffling load is minimised, and that the right balance between parallelism and throughput is struck - you may be able to split the task over 200 mappers, but is it faster than splitting it across two?

There's a lot more to all this, as I'm sure you can imagine - keying/shuffling strategies to minimise data transfer, tweaking parallelism on mappers and reducers to hit the sweet spot where increased parallelism gives the most reward. You can customise almost all aspects of MapReduce, from how records are keyed, to the logic of the shuffle steps and how records are combined together, so you have an immense amount of control.

### Examples

#### Word Count

Let's look at the word counting example we used earlier in the diagram. If we work in Python (because we like Python, right?), then our best bet is a library called [`mrjob`](https://pythonhosted.org/mrjob/). These examples have, for the most part, been pulled from the `mrjob` docs.

To jump straight to the end, here’s what the final code would look like, more or less (some of the I/O has been skipped for brevity):

```python
from mrjob.job import MRJob
import re

WORD_RE = re.compile(r"[\w']+")


class MRWordCount(MRJob):

    def mapper(self, _, line):
        for word in WORD_RE.findall(line):
            yield (word.lower(), 1)

    def reducer(self, key, values):
        yield key, sum(values)


if __name__ == '__main__':
    MRWordCount.run()
```

How does this work? Well, each mapper takes a line of the input text, yielding each word with a count of 1. The reducer will take a single key (word) at a time, with a list of all the values assembled by the mappers (this will be a list consisting of one ‘1’ for each instance of the key parsed by the mappers). It then sums up the values and yields them alongside the key. Simples!

#### Most used word

To add a little more complexity, let’s try and find the most used word in the text, along with the number of times it’s used. Again, here’s the final code first:

```python
from mrjob.job import MRJob
from mrjob.step import MRStep
import re

WORD_RE = re.compile(r"[\w']+")


class MRMostUsedWord(MRJob):

    def steps(self):
        return [
            MRStep(mapper=self.mapper_get_words,
                   combiner=self.combiner_count_words,
                   reducer=self.reducer_count_words),
            MRStep(reducer=self.reducer_find_max_word)
        ]

    def mapper_get_words(self, _, line):
        for word in WORD_RE.findall(line):
            yield (word.lower(), 1)

    def combiner_count_words(self, word, counts):
        yield (word, sum(counts))

    def reducer_count_words(self, word, counts):
        yield None, (sum(counts), word)

    def reducer_find_max_word(self, _, word_count_pairs):
        yield max(word_count_pairs)


if __name__ == '__main__':
    MRMostUsedWord.run()
```

As you can see, the complexity has jumped a fair bit. We’re doing this in two parts. Firstly, we’re performing the same operations as before - finding counts for every word in the text. Then, we find the maximum count, and the word associated with it.

This means running two MapReduce steps in sequence - a common pattern once complexity grows beyond a single operation. The first is pretty similar to the original WordCount job, with the addition of a custom combiner. Combiners sit between the Mapper and Reducer, combining all records with the same key, to minimise data transfer between mappers and reducers. You may notice that the reducer for the first job (reducer_count_words) yields a slightly different pattern - a key of None, and then the count and word together as the value. This is a sneaky trick to give every output record the same key, so they’ll all end up on the same reducer. This means you can perform operations across every record in one go.

The second MR job doesn’t have a map phase at all - it doesn’t need to do anything here. The reduce phase takes all the word counts from the previous phase (which are all mapped to a key of None), and takes the maximum row.

## Spark

So we've seen a fair bit about Hadoop and MapReduce, and how all that works, but let's face it, if you're looking at processing data these days, chances are you won't be using MapReduce. So now it's onto the main player these days - [Spark](https://spark.apache.org/). Spark is an open-source framework, now ‘owned’ by [DataBricks](https://databricks.com/), designed to fix/improve upon many of the original frustrations developers had with Hadoop/MapReduce.

### How is it different/better?

Spark has a much easier/more accessible interface than existing tools, giving a higher-level toolkit with which to tackle data processing problems. Whereas MapReduce has, at its most basic, two operations (Map and Reduce), Spark has dozens (for RDDs, for DataFrames there are way more), encouraging a more natural flow in processing. This makes it much easier to tackle more complex problems, as well as making Spark programs (generally) easier to understand/read.

### Streaming

MapReduce is built around the concept of batch processing - taking a big chunk of data and processing it in one go. That works well for fairly static data, but in the age of the internet, a lot of data is constantly being updated, and even with MapReduce, people started to write jobs to incrementally process data on regular intervals. Spark retains the batch processing capabilities of MapReduce, but adds a native ‘streaming’ interface, to process streams of data - think a social media feed, or data from an IoT device. This thankfully started the slow death of the ‘lambda architecture’ - a brief fad combining streaming and batch systems to try and get the best of both worlds.

### In-memory storage

The big win for Spark was processing data in-memory. As mentioned in the MapReduce section, Hadoop M/R jobs write data to disk between every step, then read it back out for the next. This makes the jobs very resilient to individual machine failures, as everything is persisted (only a single machine’s stages are lost), but very slow. If you’re trying to perform many consecutive operations on a huge dataset, then writing everything to disk and reading it between every step is really slow.

Spark stores data in memory, persisting the data to disk in the background. That, along with a bunch of other clever optimisation tricks allows it to be potentially 100x faster than an equivalent Hadoop job. When you’re processing petabytes of data every day, that can become the difference between usable daily data and… nothing.

### Running Spark

Spark runs atop a cluster of machines, but doesn’t have to run directly on the machines. Options include:
 - Spark native - run Spark directly on the machines
 - Hadoop YARN - run Spark via the YARN scheduler framework. This is a good option if you want to access data stored on HDFS, or want to share your cluster with Hadoop jobs
 - Apache Mesos - Mesos is another scheduling framework - it adds an abstraction layer atop a cluster of machines, allowing different frameworks to run simultaneously (i.e. like YARN, but more versatile).
 - Kubernetes - a Google-backed scheduling framework, approximately equivalent to Mesos.

### Language

Spark is written in Java and Scala, but has native interfaces in Java, Scala, Python and R. There are other adapters for a host of other languages.

The Python interface works pretty well, and is well supported for the most part, although it does have some ‘fun’ quirks - if you manage to make it throw errors, it will sometimes do so in 3 different languages, making tracking down issues… complex.

Python and Scala also have a REPL - an interactive shell - which can make prototyping/quick data explorations a breeze. Because of this, it can also be called from notebooks, which I’m sure will appeal to some :)

### Disadvantages

Spark has a lot of great features, but there are a few downsides. One is the complexity - there’s a huge amount to learn, and it can take years to grasp the nuances of the various features. Tuning and optimising Spark jobs in particular is a fine art - there are a huge number of variables, and getting good performance is hard. Particularly for smaller datasets, running through Spark, even optimised Spark, can end up being slower than an equivalent plain ol’ Python program, just because of the overhead of spinning up a job on a large Spark cluster, sending data to and fro across the network.

Setting up a Spark cluster (whether dedicated, or via Kubernetes, Mesos or YARN) is non-trivial - even upon cloud compute it can be a lot of configuration and networking - you need devops assistance to maintain it and keep everything running smoothly.

Finally, if you have a decent number of Spark jobs, and start creating utils, and job tests, testing can be a nightmare. The official way to test Spark involves spinning up a dedicated Spark node (either locally or on a Cluster), running a test, and spinning down again. That’s really slow, even with minimal settings. I actually ended up writing a library to mock Spark and run unit tests (it currently only supports RDDs, and is probably a bit out of date, but was hundreds of times faster than spinning up Spark).

### Spark Architecture

Spark can be run either in ‘local’ mode, in which case it will run on the local machine, or in a ‘cluster’ mode, in which case it will run the job on a specified cluster. Spark clusters consist of one or more master nodes, which orchestrate job running, and where data ends up, and zero or more slave/worker nodes. These perform the majority of the heavy lifting. Certain operations are run purely on the master nodes, and some purely on workers (another factor to consider when tuning jobs). If there is more than one master, then the masters can recover from failure (one of the master nodes failing/going down), and generally jobs are resilient to the failure of worker nodes.

### Data Locality

When processing large amounts of data, you’ll want to consider where the data is coming from. If it’s coming from some external datastore, all of that data will need to be streamed over the network, which will add a lot of network traffic and time to jobs. Another option is going for data locality - trying to store the data on the same nodes that will do the processing. This is often done when the data is stored in HDFS or Cassandra - running both data storage and processing on the same physical machines. You’ll also need to consider the parallelism of the jobs involved to minimise streaming of data between nodes - if running on YARN, Spark can optimise tasks for where the data is located, which can make a big difference.

### Launching Spark jobs

As with many distributed frameworks, jobs are launched by passing a job in a self-contained class to a special script. In the case of Spark, there’s a launcher script called spark-submit, that lives in bin in any spark installation. This bundles up the job and fires it off to to the master node for execution.

If your code is not entirely self-contained, then things start to get a little more complex. If you have 3rd party library dependencies, then you’ll need to to make sure that these are installed on every single machine in the cluster. Referencing your own code requires packaging it up and passing it across to the cluster.

This launching method does mean that running jobs from a local application requires some wrapping to make sure that everything is configured correctly and the right bits of code are sent to the right place. I’ll cover a solution I’ve used for DataProc in the DataProc section.

### Data Structures

There are three main concepts to cover when working with Spark - SparkContext, RDDs and DataFrames. The SparkContext is the main entry-point to Spark. This is where you configure which cluster you’re connecting to, job configuration, and how you pull datasets into Spark.

```python
conf = SparkConf().setAppName(appName).setMaster(master)
sc = SparkContext(conf=conf)
```

In terms of datasets, there are two different structures in which data can be stored in Spark - RDDs and DataFrames. Each works best in different scenarios, and it’s possible to move data between one and the other.

#### RDDs

RDDs (Resilient Distributed Datasets) are the bread and butter of Spark. These are what they say on the tin - a way of representing a collection of data - a list, a set, whatever it may be. The items in an RDD do not all have to be of the same type - it’s merely a bucket of data. RDDs can be modified by many common functional operators - map, filter, reduce, etc - as well as more specialised operators that assume data in key-value form, similar to that used in MapReduce. This key-value form operates in similar ways - the key is used to control parallelism, with keys used to assign data to different Spark workers, and in various grouping operations.

#### DataFrames

DataFrames are a later addition, and if you’re from a Data Science background, they’re not dissimilar to Pandas’ DataFrame construct (albeit designed for parallelised processing within Spark). They hold more structured data in a columnar format, with each column having a discrete type. This means that each row of data in a DataFrame is of the same type, effectively, which means there are more assumptions that can be made when using operators.

DataFrames are part of SparkSQL - an SQL-like construct over base Spark (RDDs and their associated operators), giving a familiar relational-esque interface to tables of data. There are joins, unions, etc. DataFrames can be used directly, in a similar manner to RDDs, by creating a dataset and calling methods upon it (map, filter, etc), or indirectly, by creating tables (virtual constructs over distributed datasets), and running scripts written in SparkSQL over them. This means that folks more used to working in SQL can still analyse huge non-relational datasets in Spark - SparkSQL provides a similar interface to Apache Hive in the Hadoop/MapReduce world.

### Examples

#### Word Count

Count all words present in a file of data.
(Assumes a SparkContext set up and available as sc).

```python
text_file = sc.textFile("hdfs://...")
counts = text_file.flatMap(lambda line: line.split(" ")) \
             .countByValue()
counts.saveAsTextFile("hdfs://...")
```

As you can see, Spark uses a fluent interface to chain operations together to build a logical pipeline to process data. Here, we read in the file with textFile, which produces an RDD of each line in the file. We then use flatMap to split each line into a set of words (flatMap takes one input, and yields zero to many outputs), count the values per key, and save the output as another text file.

So far, so familiar - it’s just MapReduce with nicer syntax.

#### Most used Word

```python
text_file = sc.textFile("hdfs://...")
counts = text_file.flatMap(lambda line: line.split(" ")) \
             .countByValue() \
             .reduce(lambda a, b: a if a[1] >= b[1] else b) \
             .collect()
```

Here you can see that once the problem becomes a little more involved, the simplicity of Spark starts to come through. This removes a lot of the extra steps involved in MapReduce, and is largely easier to follow the logic of.

### Cloud DataProc

#### What is it?

Cloud DataProc is a service by Google, that is a value add on top of basic compute - the basis of almost all cloud compute providers. People have been running Spark and MapReduce on cloud computing since the early days of such services, as it enables relatively small companies to perform huge amounts of computation without owning their own data centres. However, setting up a Spark/Hadoop cluster on bare compute takes a fair amount of DevOps experience, and maintaining it also is a non-trivial operation.

With that in mind, Google (and AWS, with EMR) have decided to offer hosted Spark/Hadoop clusters as a service - press a button and your cluster spins up, and press another and it shuts down.

#### How does it work?

DataProc adds a UI, an API and CLI integration, allowing spin-up of an arbitrarily-sized Hadoop and Spark cluster (each cluster comes with Hadoop and Spark preinstalled - generally each will be at the latest major release). You can choose the size and number of nodes, from a single node cluster, up to a multi-thousand node cluster with 96 core machines. All of the networking between nodes is all handled by GCP, and you’re simply provided with a name to connect to.

Jobs are launched via the DataProc UI - you tell it what cluster to run the job on, and GCP again figures out how to package everything up and send to the cluster, and how to return results.

You can configure what dependencies and packages are present on each node in the cluster by use of ‘init scripts’ - essentially shell scripts that are executed on the nodes as they’re being configured. These can install linux packages, set environment variables and install python packages.

If you need to SSH into a given machine, the UI will give you access to the underlying compute instances, and from there they act like any other compute instance - you can SSH in, as well as view CPU usage, memory usage, etc.

#### How do you use it?

There are two main concepts in the DataProc world - clusters and jobs. Clusters are what we’ve talked about above - Spark/Hadoop clusters of virtual machines running on the Google Cloud Platform. Jobs are the actual processing tasks submitted to those clusters. Each has its own associated operations, which can be accessed from either the UI, via the RESTful API (every GCP service has an associated RESTful API) or through the CLI tools.

#### The Web UI

The UI is fairly self-explanatory - there are two sections to choose from - one for clusters and one for jobs. The clusters page will show any launched clusters, and allow you to create one. There’s a form to fill out the various machine specifications, configurations options and whatnot, then you click ‘Create’, and off it goes!

Clusters will only be shown in the cluster tab whilst they are active - once shut down, they will be removed from the UI.



Above is a screenshot of a running cluster in the UI.



Here is the cluster detail view (from clicking on an active cluster). This will give a graph-based view on stats for the cluster for various metrics (CPU, disk, network), as well as a list of jobs on the cluster, the individual VM instances, and the details of the configuration used to launch the cluster.

From that third tab (VM Instances), you’ll be able to see the instances, and SSH into each one, which can be useful for debugging, poking around, testing configuration, that sort of thing. 

To delete a cluster, just click the big ‘Delete’ button, it does what you’d think it does.



Jobs are a little different - every time you submit a job, it will create an entry on the job page, with details about the cluster, the type of job (PySpark, Spark, Hadoop, etc), and job status. If the job is running, clicking on the job will give you a somewhat live update of the job logs as they stream back from the cluster (sometimes the logs lag a bit). 

For jobs that have finished (either successfully or otherwise), logs may be present on the UI. The reason that this is a ‘maybe’ is that job logs are stored in a GCS bucket created when the cluster is created. If the cluster is deleted and cleaned up, the bucket will be deleted, and thus the logs will no longer be available. Normally, this is not a problem, but if you really want to keep a particular log, then it’s probably best to copy it elsewhere.

#### CLI

Every GCP service is available through a RESTful API, and hence through the gcloud command-line tooling. In the case of DataProc, the command is (unsurprisingly) gcloud dataproc:

```bash
→ gcloud dataproc
ERROR: (gcloud.dataproc) Command name argument expected.
Usage: gcloud dataproc [optional flags] <group>
  group may be           clusters | jobs | operations | workflow-templates

For detailed information on this command and its flags, run:
  gcloud dataproc --help
```

I’m not going to dive into the ins and outs of each command/argument - the CLI is pretty intuitive and well documented, and if you’re using it, hopefully you know what you’re doing!

#### API/Python

As mentioned, all of the GCP services have a RESTful API. They also have generated clients in a few major languages (the subset available varies depending upon the service in question). In the case of DataProc, Python, R and Scala are supported to various degrees. However, the Python API client is an autogenerated one, and is rather clunky to use. To that end, I ended up writing my own wrapper around it (shameless plug!), which gives a more intuitive interface, and wraps a lot of common commands into a single method call. It also adds a few nice-to-haves, like streaming job logs back from the cluster as it executes - something you’d get from running Spark, but that DataProc doesn’t offer natively. Hopefully, the README gives a good overview of how it works, and how to do most of the basics.

#### Existing implementation

TODO rewrite this to be less LG specific

Dataproc, like spark, works by having isolated jobs that process data. This is fine for one or two jobs, but once tasks need to be integrated into a wider project, there needs to be a little more integration. A pattern used in Picard (albeit briefly, before we realised that DataProc was overkill there), was to wrap DataProc within a wider application. That way, the parts that need the power of DataProc can use them, and the rest of the application can integrate with it.

This works by essentially creating an application within an application. Spark jobs are individual applications in their own right, so this integration involves having a launcher within the wider application, that figures out which job you want to run, wraps up all the code involved, launches an appropriate cluster (or uses an existing one), and sends off all the code to it. That code forms its own self-contained application that can run on Spark. Once it’s all done, the cluster can be shut down if required.

This allows clusters to be sized per job, and have different dependencies (one job may require tensorflow, and another not - this approach can set up a cluster with only the required dependencies). However, it does have some downsides - it is fairly complex (there are a lot of layers/moving parts), and if you’re spinning up a cluster per job, unless your job takes a long time to run, your application runtime will be dominated by the cluster spin-up/down. Tl;dr - it works, but definitely has some serious drawbacks.

## Apache Beam

TODO a better intro to this

Beam is designed to be a higher-level abstraction (yes, the layers, the layers…) over Spark/Flink/others, to remove all that hassle with tuning, parallelisation and the like. Having realised that tuning Spark jobs is an art form that you can never really succeed at, Beam aims to remove that part entirely - you point it at a cluster, and it runs as fast as it possibly can. It also exposes lots of metrics and graphs, so that if you have inadvertently made a bottleneck, you can spot it easily.

It also removes the distinction between Streaming and Batch computation - now everything uses the same pipelines. If the data source is static, it runs in batch, otherwise it streams results, and the user doesn’t have to know the difference. There are APIs available in Java, Go and Python.

I should note at this point that whilst I’ve worked with DataProc extensively, and have built a production system around it several times, I’ve only done initial testing of DataFlow and haven’t used it in anger - take what I say with a pinch of salt.

### Runners

Because Beam is an abstraction, it doesn’t reinvent the wheel when it comes to the actual data processing. All of the operations you can perform in Beam are actually translated into operations in another framework. Currently, it can run in one of 5-6 different modes:
 - Direct (running directly on the local machine)
 - Apex
 - Flink (local and cluster)
 - Spark
 - DataFlow

Which one you choose depends on what benefits/drawbacks you want to live with, as each brings its own guarantees/issues due to implementation differences. There’s work ongoing to try and bring the same feature set and similar guarantees to each runner, but the exact specifics will vary. More detail here.

### Cloud DataFlow

Cloud DataFlow is one of the Runner options for Beam - essentially a computational back-end for Beam. This is quite similar to DataProc, in that it uses the benefits of cloud compute to avoid running your own cluster, but takes it further - it avoids the need to spin up a dedicated cluster, allocating as many compute resources as it can once the job is submitted. Because Beam can allocate compute and tune jobs automatically, it effectively means that DataFlow can run jobs as fast as possible, as the maximum amount of compute available is effectively infinite, and the compute is charged per unit time. If a job can be parallelised massively, it will be, so it will be run as fast as it possibly can, and it will cost the same as running it in a less parallel fashion over a longer time period.

tl;dr DataFlow is serverless - it removes the need for interaction with any form of physical server - you’re just paying for things to be computed, as fast as possible.

### Key Concepts

Pipeline - a series of processing steps making up a data processing task. Equivalent to a Spark or MapReduce job.
PCollection - a wrapper around data, either externally sourced (e.g. from a DB, files, etc) or loaded in from memory. Can be bounded (i.e. a fixed amount of data) or unbounded (e.g. streaming data). This is a similar concept to RDDs and DataFrames in Spark.
PTransform - a wrapper around a transformation of some kind - it takes one or more PCollections, performs some user-defined processing function, and outputs zero or more PCollections. This can be something like a map, reduce or similar, or an I/O transform, which pushes data out to some external store.

### Launching a Pipeline

As mentioned in the ‘Runners’ section, DataFlow can launch on a number of different platforms, from the local machine to Spark to DataFlow. I’ll cover local and DataFlow here - the two are fairly similar - and if you’re interested, examples for the other runners are on the Python Quickstart page for Beam.

#### Direct

```bash
python -m apache_beam.examples.wordcount --input /path/to/inputfile --output /path/to/write/counts
```

#### DataFlow

```bash
python -m apache_beam.examples.wordcount --input gs://dataflow-samples/shakespeare/kinglear.txt \
                                         --output gs://<your-gcs-bucket>/counts \
                                         --runner DataflowRunner \
                                         --project your-gcp-project \
                                         --temp_location gs://<your-gcs-bucket>/tmp/
```

N.B. you need to make sure you have the DataFlow Beam pip module installed before running this: 
```bash
pip install apache-beam[gcp]
```

### Examples

#### Word Count

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import re

p = beam.Pipeline(options=PipelineOptions())
lines = p | “ReadInput” >> beam.io.ReadFromText(“gs://some/inputData.txt”) \
          | beam.FlatMap(lambda line: re.findall(r'[A-Za-z\']+', x)) \
          | beam.combiners.Count.PerElement() \
          | beam.Map(lambda word_count: '%s: %s' % (word_count[0], word_count[1])) \
          | beam.io.WriteToText('gs://my-bucket/counts.txt')

result = p.run()
```

As you can see, it resembles Spark in some ways - a chain of operations one after the other. Each of the main operations (FlatMap, Count, Map) are instances of PTransforms. There is a plethora of built-in operations, and you can define your own if there isn’t one that fits your use case.

One result of Beam allowing custom PTransforms is that you can combine other PTransforms into new operations, consolidating commonly used operations. To return to the example above, you could combine the splitting of lines and counting into a single operation:

```python
class CountWords(beam.PTransform):

  def expand(self, pcoll):
    return (pcoll
            # Convert lines of text into individual words.
            | 'ExtractWords' >> beam.FlatMap(
                lambda x: re.findall(r'[A-Za-z\']+', x))

            # Count the number of times each word occurs.
            | beam.combiners.Count.PerElement())

counts = lines | CountWords()
```

This might not make sense for an operation you only do once or twice, but for combining chains of operations, it’s a very useful feature to have.

#### Most frequent Word

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import re


p = beam.Pipeline(options=PipelineOptions())
lines = p | “ReadInput” >> beam.io.ReadFromText(“gs://some/inputData.txt”) \
          | beam.FlatMap(lambda line: re.findall(r'[A-Za-z\']+', x)) \
          | beam.combiners.Count.PerElement() \
          | beam.combiners.core.CombineGlobally(
                combiners.TopCombineFn(1, lambda first, second: first[1] < second[1]))
          | beam.Map(lambda word_count: '%s: %s' % (word_count[0], word_count[1])) \
          | beam.io.WriteToText('gs://my-bucket/counts.txt')

result = p.run()
```

TODO outro