import sys
import asyncio
import argparse

from black.workers.nmap.nmap_worker import NmapWorker
from black.workers.masscan.masscan_worker import MasscanWorker
from black.workers.patator.patator_worker import PatatorWorker
from black.workers.dirsearch.dirsearch_worker import DirsearchWorker


def run(task):
    try:
        loop = asyncio.get_event_loop()
        task_instance = task()
        loop.create_task(task_instance.start())
        loop.run_forever()
    except KeyboardInterrupt:
        loop.run_until_complete(task_instance.stop())
        sys.exit(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Launch one of workers')
    parser.add_argument(
        'worker', nargs=1,
        choices=['masscan', 'nmap', 'patator', 'dirsearch'],
        help='worker type')

    args = parser.parse_args()
    worker_type = args.worker[0]

    if worker_type == 'nmap':
        run(NmapWorker)
