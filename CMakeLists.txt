cmake_minimum_required(VERSION 3.25)
project(ds2_online_revival C)

add_library(ds2_online_revival OBJECT
    plugin/plugin.c
)

set_target_properties(ds2_online_revival PROPERTIES
    C_STANDARD 17
    C_STANDARD_REQUIRED ON
    C_EXTENSIONS ON
)

target_compile_options(ds2_online_revival PRIVATE
    -Wall
    -Wextra
    -Werror
)

# DashLaunch system plugin. Verify the base address against the target console.
xsdk_add_plugin(ds2_online_revival BASE 0x91440000)
