### SETTINGS
### ========

# Current environment
export NODE_ENV ?= development
export BEMTREE_ENV := NODE_ENV
export BEMHTML_ENV := NODE_ENV

# Project name
#PROJECT_NAME = unknown

# Node path
NODE_BIN_PATH := /usr/bin /usr/local/bin

# Line separator
LINE_BREAK := $(shell printf '*%.0s' {1..90})

# Project root path
ROOT_PATH := $(PWD)

# Node bin
NODE := $(shell find $(NODE_BIN_PATH) -name node \( -type f -or -type l \))

# Configs path
CONFIGS_PATH := $(ROOT_PATH)/configs

# Application path
APP_PATH := $(ROOT_PATH)/app

# Node modules path
NODE_MODULES_PATH := $(ROOT_PATH)/node_modules

# Node modules bin path
NODE_MODULES_BIN_PATH := $(NODE_MODULES_PATH)/.bin

# BEM path
BEM_PATH := $(ROOT_PATH)/bem

# BEM bundles path
BEM_BUNDLES_PATH := $(BEM_PATH)/bundles

# Bower modules path
BOWER_MODULES_PATH := $(ROOT_PATH)/bower_modules

# Static path
STATIC_PATH := $(ROOT_PATH)/public/static

# Enb
ENB := $(NODE_MODULES_BIN_PATH)/enb

# Process manager
PROCESS_MANAGER := pm2

# Application config dir
export NODE_CONFIG_DIR := $(CONFIGS_PATH)/app

# Print break line
$(info $(LINE_BREAK))

### UNINSTALL
### =======

# Uninstall npm, bower packages
.PHONY: uninstall
uninstall: npm.delete bower.delete

# Delete npm packages
.PHONY: npm.delete
npm.delete:
	@echo '===> Removing npm packages'
	rm -rf $(NODE_MODULES_PATH)

# Delete bower packages
.PHONY: bower.delete
bower.delete:
	@echo '===> Removing bower packages'
	rm -rf $(BOWER_MODULES_PATH)

### APPLICATION
### ===========

# Start application
.PHONY: start
start:
	@echo '===> Running the application'
	@echo 'User: $(shell whoami)'
	@echo 'Environment: $(NODE_ENV)'
	@echo 'Nodejs version: $(shell $(NODE) --version)'
	$(PROCESS_MANAGER) start index.js -n $(PROJECT_NAME) --no-autorestart --log-date-format="YYYY-MM-DD HH:mm:ss.SSS"

# Stop application
.PHONY: stop
stop:
	@echo '===> Stoping the application'
	$(PROCESS_MANAGER) delete $(PROJECT_NAME)

# Restart application
.PHONY: restart
restart:
	@echo '===> Restarting the application'
	$(PROCESS_MANAGER) restart $(PROJECT_NAME)

### BEM
### ===

# Make bem tech(s)
.PHONY: bem
bem:
	@echo '===> Make bem tech(s)'
	$(ENB) make ${tech} --no-cache --dir $(BEM_PATH)

# Clean bem techs
.PHONY: bem-techs.clean
bem-techs.clean:
	@echo '===> Cleaning bem bundles'
	$(ENB) make clean --dir $(BEM_PATH)

# Create bem configs
bem-configs.create:
	@echo '===> Creating bem configs'
	ln -sf $(NODE_MODULES_PATH)/app-core/configs/bem/borschik.json $(BEM_PATH)/.borschik

.PHONY: bem-configs.delete
bem-configs.delete:
	@echo '===> Deleting bem configs'
	rm -rf $(BEM_PATH)/.borschik

### Structure
### ---------

# Create static dir
static-dir.create:
	@echo '===> Сreating static dir'
	mkdir -p $(STATIC_PATH)

# Clean
.PHONY: clean
clean: bem-configs.delete temp-files.delete bem-techs.clean static-dir.delete

# Delete static dir
.PHONY: static-dir.delete
static-dir.delete:
	@echo '===> Deleting static dir'
	rm -rf $(STATIC_PATH)


# Delete temporary files
.PHONY: temp-files.delete
temp-files.delete:
	@echo '===> Deleting temporary files'
	rm -rf $(BEM_PATH)/.enb/tmp

### DEBUG
### =====

# Show current process
.PHONY: process.show
process.show:
	@echo '===> Current process'
	$(PROCESS_MANAGER) show $(PROJECT_NAME)

# Show logs
.PHONY: logs.show
logs.show:
	@echo '===> Logs'
	$(PROCESS_MANAGER) logs $(PROJECT_NAME)

### LINT
### ====

# Lint stylus, js files
.PHONY: lint
lint: lint.stylus lint.js

.PHONY: lint.stylus
lint.stylus:
	@echo '===> Linting stylus files'
	$(NODE_MODULES_BIN_PATH)/stylint --config $(NODE_MODULES_PATH)/stylint-config-4ok/.configrc $(BEM_PATH)/blocks/

.PHONY: lint.js
lint.js:
	@echo '===> Linting js files'
	$(NODE_MODULES_BIN_PATH)/eslint .
