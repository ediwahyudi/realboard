#!/bin/bash

keytool -genkey -v -keystore RealBoardClient.keystore -alias realboard -keyalg RSA -keysize 2048 -validity 10000
