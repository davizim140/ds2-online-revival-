#include <stdint.h>

#include "xsdk/plugin.h"

static const int64_t one_second = -10000000LL;

void plugin_main(HANDLE module)
{
    (void)module;

    xsdk_plugin_log_open("\\\\Device\\\\Harddisk0\\\\Partition1\\\\ds2_online_revival.log");
    xsdk_plugin_log("DS2 Online Revival: plugin_main entered");
    xsdk_plugin_log("DS2 Online Revival: diagnostic build; no game hooks or network redirection");

    for (;;) {
        (void)KeDelayExecutionThread(0, 0, &one_second);
    }
}
