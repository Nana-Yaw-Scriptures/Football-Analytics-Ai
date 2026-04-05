package com.scorinai.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full screen immersive — hides status bar and nav bar initially
        getWindow().setStatusBarColor(Color.parseColor("#050810"));
        getWindow().setNavigationBarColor(Color.parseColor("#050810"));

        // Keep screen on while app is active
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Full screen flags for immersive mode
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }
}