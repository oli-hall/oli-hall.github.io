---
layout: post
title: "Streaming job logs from Cloud DataProc"
date: 2018-01-08 17:37
categories: posts
comments: true
---

It's been a fair while since my last post, but I'm back at the metaphorical grindstone once again! To cut a long story short, what with Christmas, starting a new job and moving house, I've had a lot on my plate!

I've been working with Google Cloud DataProc fairly extensively, and one of the biggest changes I've noticed versus working directly with Spark is the lack of local logs. For the uninitiated, you submit Spark (or Hadoop, YARN etc) tasks as 'jobs' to a particular DataProc cluster. They're assigned an alphanumeric ID, and you can track their progress via a web UI. However, it's fairly annoying to load up the web UI each time, click on your job, and watch it slowly unfold. The web viewer is _OK_, but hardly the most sophisticated, and doesn't render things like carriage returns correctly, and often won't refresh properly. In short, a bit frustrating.

## Baby steps...

We can definitely do better than that. A good first step would be to fetch the logs locally. But where are they?

A bit of digging and introspection of the messages output when a job fails reveals that they are stored in the GCS bucket attached to the DataProc cluster when it's created. Knowing that and the job ID, it is possible to reconstruct the path (This assumes you have a [pydataproc](https://github.com/oli-hall/py-dataproc) client available as `dataproc`):

```python
storage_client = storage.Client('my_GCP_project_ID')

cluster_info = dataproc.cluster_info('my_cluster_name')
log_location = 'google-cloud-dataproc-metainfo/{}/jobs/{}/driveroutput'.format(
    cluster_info['clusterUuid'],
    "my_job_id"
)

cluster_bucket = cluster_info['config']['configBucket']
job_log_location = 'gs://{}/{}'.format(cluster_bucket, log_location)
```

Basically, we pull out the cluster's bucket from the cluster metadata, and combine that with the cluster UUID and job ID to form the path to the log files. Simples!

Well, the next stage is to fetch the files back to your machine, and dump them out on the command line (ideally respecting carriage returns). If we ignore streaming the files for now, we should fetch them at the end of the job so that they're complete. Given we have the path and the bucket, we can iterate through the folder contents, and dump them straight through `sys.stdout`:

```python
storage_client = storage.Client('my_GCP_project_ID')
print('\nJOB LOGS:\n--------------------\n')
cluster_info = self.dataproc.cluster_info('my_cluster_name')
log_location = 'google-cloud-dataproc-metainfo/{}/jobs/{}/driveroutput'.format(
    cluster_info['clusterUuid'],
    'my_job_id'
)
cluster_bucket = storage_client.bucket(cluster_info['config']['configBucket'])
for l in cluster_bucket.list_blobs(prefix=log_location):
    sys.stdout.write(l.download_as_string().decode('utf-8'))
```

Excellent, we now have logs! That means, when a job fails, you can pull the logs out, and see what went wrong without having to load up the UI. After all, that's when you want to see them most, right?

This helps a bunch, but still, we don't have any interactivity - we sit there like lemons until the job finishes, then we get to find out what happens - not ideal! This, needless to say, bugged me. No matter how much I looked, there was no support for streaming from a constantly updated file on GCS, much to my chagrin. You can stream a file, but as far as I could tell, there's no way to wait for updates, so any solution would have to involve polling the file, which seems excessive, and probably the wrong approach.

However, after digging into the docs, I discovered a potential saviour - the `gcloud` utils! It turns out that there is a `gcloud dataproc jobs wait <job_id>`, which _does_ stream job logs, and dumps out job config at the end. Perfect! A quick test, and sure enough - it does exactly what I need. Sadly, it's not part of the REST API, which means it's not in the Python API library. I can understand this, as I'm not actually sure a pipe in a REST API makes any sense whatsoever, but it means no Python support.

## To the subprocess-mobile!

Well, it's a hack, but if you wrap this in `subprocess`, it just works (TM). The only slight modification is to pipe `stdout` to an output parameter that isn't used, which takes care of the job configuration being printed upon job completion. Here's the final code:

```python
subprocess.call(
    [
        "gcloud",
        "dataproc",
        "jobs", 
        "wait",
        "--region",
        "GCP DataProc region",
        "my_job_id"
    ],
    stdout=subprocess.PIPE
)
```

It's not my finest bit of coding, but wrapped up in a method, it gives much-needed interactivity to DataProc jobs, and allows you to see and catch errors early! I'm hoping to wrap this up into `py-dataproc` in the next week or so.
