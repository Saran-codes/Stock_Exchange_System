cmake_minimum_required(VERSION 3.10)
project(core_engine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 1) Threads for std::thread
find_package(Threads REQUIRED)

# 2) Try pkg-config first (if you installed librdkafka-dev + librdkafka++-dev)
find_package(PkgConfig QUIET)
if (PkgConfig_FOUND)
  pkg_check_modules(RDKAFKA_CPP QUIET librdkafka++)
endif()

if (RDKAFKA_CPP_FOUND)
  message(STATUS "Found librdkafka++ via pkg-config")
  include_directories(${RDKAFKA_CPP_INCLUDE_DIRS})
  link_directories(${RDKAFKA_CPP_LIBRARY_DIRS})
  set(RDKAFKA_LIBS ${RDKAFKA_CPP_LIBRARIES})
else()
  message(STATUS "pkg-config failed, falling back to manual find")

  # 2a) Locate headers under /usr/include/librdkafka
  find_path(RDKAFKA_INCLUDE_DIR
    NAMES   rdkafkacpp.h
    PATHS   /usr/include /usr/local/include
    PATH_SUFFIXES librdkafka
  )
  if (NOT RDKAFKA_INCLUDE_DIR)
    message(FATAL_ERROR "Could not find rdkafkacpp.h; "
                        "ensure librdkafka++-dev is installed")
  endif()

  # 2b) Locate library under /usr/lib or /usr/lib/x86_64-linux-gnu
  find_library(RDKAFKA_LIB
    NAMES   rdkafka++ rdkafkacpp
    PATHS   /usr/lib /usr/lib/x86_64-linux-gnu
  )
  if (NOT RDKAFKA_LIB)
    message(FATAL_ERROR "Could not find liblibrdkafka++.so; "
                        "ensure librdkafka++-dev is installed")
  endif()

  include_directories(${RDKAFKA_INCLUDE_DIR})
  set(RDKAFKA_LIBS ${RDKAFKA_LIB})
endif()

# 3) Your source files
file(GLOB CORE_SRC src/*.cpp src/*.h)

# 4) Build target
add_executable(matching_engine ${CORE_SRC})
target_link_libraries(matching_engine
  ${RDKAFKA_LIBS}
  Threads::Threads
)

