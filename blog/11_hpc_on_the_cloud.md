# HPC on the Cloud: A Quick Overview

The first applications of cloud computing were about as far from HPC as it gets — cloud providers' early focus was on cheap commodity hardware. That's changed: compute-intensive workloads now run in the cloud as a matter of course.

More recently, cloud providers have started offering InfiniBand — the standard for networking MPI applications. Azure has published HPC-focused VM offerings, Google Cloud has released InfiniBand-backed instances, and AWS supports MPI through its own low-latency networking approach. Tightly coupled MPI jobs on the cloud are a solved problem at this point.

---

## When cloud-based HPC is worth the cost

That question could fill a post on its own, but a few sweet spots stand out:

- **Short, sharp workloads** that don't easily find a slot on existing on-prem facilities.
- **Embarrassingly parallel jobs** that run fine on cheap hardware.
- **GPU computing**, whether for routine use or hardware experimentation.

These workload types have very different hardware requirements, and one of the real benefits of the cloud is provisioning the right hardware for each one rather than compromising on a single fixed cluster.

## How to actually run HPC workloads on the cloud

The biggest obstacle for a newcomer is the sheer number of heavily marketed options for running jobs and applications.

### Is Kubernetes useful for HPC?

Kubernetes comes up constantly — enough that not using it can start to feel like you're missing something. But the core difference matters: an HPC workload runs to completion on a complex task, however long that takes, while Kubernetes is built for continuously running services.

HPC is about jobs that finish. Kubernetes was designed to host things that don't. The question worth asking is simply: do you intend to host services? If not, Kubernetes doesn't have much to offer, and it adds a real layer of complexity on top. It's also worth remembering that Kubernetes isn't a tool so much as a framework for building applications — adopting it is the start of configuring your environment, not the end.

### Slurm on the cloud

Job scheduling is a genuinely hard problem in HPC — a comparison of 15 supercomputing and big-data schedulers gives some sense of the design space. Slurm is arguably the most popular scheduler, and setting up a Slurm cluster on the cloud is a solid default option.

Every major cloud provider offers a tool to launch one directly:

- AWS ParallelCluster
- Azure CycleCloud
- Google Cloud + SchedMD

### A quick AWS ParallelCluster workflow

AWS's open-source Python CLI tool, `pcluster`, lets you configure cluster characteristics: the head node, the type and number of compute nodes (on-demand or spot), required networking capacity (including whether to provision a high-speed interconnect), and more.

It starts with installing the tool:

```
pip3 install "aws-parallelcluster<3.0" --upgrade --user
```

The typical workflow:

1. Run `pcluster configure` to create a configuration file.
2. Edit that file by hand — add S3 bucket permissions, specify a custom bootstrap script for pre- and post-install actions (e.g. installing extra dependencies as root).
3. Run `pcluster create` to allocate resources. Compute nodes aren't billed while idle, and the required VPC network is created automatically.
4. Log in to the head node via SSH (the VS Code Remote extension works well here).
5. Submit jobs to Slurm.
6. Post-process results — optionally on a visualization node with a capable GPU, using the remote visualization tool NICE DCV.
7. Tear everything down from the AWS console: terminate the head node's EC2 instance and delete the CloudFormation VPC stack.

For the full details, see the official AWS ParallelCluster documentation.
