package com.greenappers.empireclient.mixin;

import net.minecraft.client.option.SimpleOption;
import org.objectweb.asm.Opcodes;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Redirect;

import com.greenappers.empireclient.EmpireClient;
import net.minecraft.client.option.GameOptions;
import net.minecraft.client.render.LightmapTextureManager;

@Mixin(value = LightmapTextureManager.class)
public class MixinLightmapTextureManager {

	@Redirect(at = @At(value = "INVOKE", target = "Lnet/minecraft/client/option/GameOptions;getGamma()Lnet/minecraft/client/option/SimpleOption;", opcode = Opcodes.INVOKEVIRTUAL), method = "update(F)V")
	private SimpleOption<Double> getFieldValue(GameOptions options) {
		if (EmpireClient.instance.isFullBrightEnabled) {
			return EmpireClient.instance.gamma;
		} else {
			return options.getGamma();
		}
	}
}
