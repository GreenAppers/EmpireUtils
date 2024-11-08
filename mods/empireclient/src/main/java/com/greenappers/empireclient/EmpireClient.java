package com.greenappers.empireclient;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.ClientPlayerEntity;
import net.minecraft.client.option.SimpleOption;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;
import net.minecraft.world.World;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

public class EmpireClient implements ClientModInitializer {
    public static final String MOD_ID = "empireclient";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    public static EmpireClient instance;
    public boolean isFullBrightEnabled = true;

    public final SimpleOption<Double> gamma = new SimpleOption<>(
            "options.gamma",
            SimpleOption.emptyTooltip(),
            (optionText, value) -> Text.empty(),
            SimpleOption.DoubleSliderCallbacks.INSTANCE.withModifier(
                    d -> 15.0d, d -> 1.0d
            ),
            15.0d,
            value -> {
            });

    public EmpireClient() {
        EmpireClient.instance = this;
    }

    @Override
    public void onInitializeClient() {
        LOGGER.info("Initializing EmpireClient");
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> dispatcher.register(ClientCommandManager.literal("empire_fullbright")
                .executes(context -> {
                            this.isFullBrightEnabled = !this.isFullBrightEnabled;
                            context.getSource().sendFeedback(Text.literal("FullBright " + (this.isFullBrightEnabled ? "enabled" : "disabled")));
                            return 1;
                        }
                )));
    }

    private static void vanillaCommandByPlayer(World world, BlockPos pos, String command) {
        ClientPlayerEntity player = MinecraftClient.getInstance().player;
        if (player != null) {
            CommandManager commandManager = Objects.requireNonNull(player.getServer()).getCommandManager();
            ServerCommandSource commandSource = player.getServer().getCommandSource();
            commandManager.executeWithPrefix(commandSource, command);
        }
    }
}