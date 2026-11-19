#include <xtl.h>

extern "C" {
    VOID DbgPrint(const char* format, ...);
}

// Safe first milestone only: confirm DashLaunch loading.
// No game hooks, kernel patches, network redirection, or fake online state.
BOOL APIENTRY DllMain(HANDLE hInstance, DWORD reason, LPVOID reserved)
{
    UNREFERENCED_PARAMETER(hInstance);
    UNREFERENCED_PARAMETER(reserved);

    if (reason == DLL_PROCESS_ATTACH) {
        DbgPrint("[DS2OnlineRevival] Loaded. Diagnostic-only build; no network hooks active.\n");
    } else if (reason == DLL_PROCESS_DETACH) {
        DbgPrint("[DS2OnlineRevival] Unloaded.\n");
    }

    return TRUE;
}
