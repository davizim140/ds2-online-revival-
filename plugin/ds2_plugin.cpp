#include <xtl.h>

extern "C" {
    VOID DbgPrint(const char* format, ...);
}

// DashLaunch/XEX module loader entry layout: LoadCount is at offset 0x40.
typedef struct _DS2_LDR_DATA_TABLE_ENTRY {
    BYTE Reserved[0x40];
    WORD LoadCount;
} DS2_LDR_DATA_TABLE_ENTRY, *PDS2_LDR_DATA_TABLE_ENTRY;

// First safe milestone only. No game hooks, kernel patches, or network changes.
BOOL APIENTRY DllMain(HANDLE hInstance, DWORD reason, LPVOID reserved)
{
    UNREFERENCED_PARAMETER(reserved);

    if (reason == DLL_PROCESS_ATTACH) {
        DbgPrint("[DS2OnlineRevival] Loaded. Diagnostic-only; no online hooks active.\n");

        // Keep the DashLaunch plugin resident, following the established
        // XInputCapsPatch/UsbdSecPatch plugin entry-point convention.
        ((PDS2_LDR_DATA_TABLE_ENTRY)hInstance)->LoadCount = 1;
        return FALSE;
    }

    if (reason == DLL_PROCESS_DETACH) {
        DbgPrint("[DS2OnlineRevival] Unloaded.\n");
    }

    return TRUE;
}
