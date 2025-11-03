package com.example.jadelobstersprint;

import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.statusbar.StatusBar; // Import StatusBar

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(StatusBar.class); // Register StatusBar plugin
        super.onCreate(savedInstanceState);
    }
}