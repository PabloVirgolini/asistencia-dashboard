#!/usr/bin/env python3
import subprocess
import sys
import re

def run_pnpm_task(command):
    print(f"[*] Ejecutando de forma local: {command}...")
    
    # Ejecutamos el comando capturando la salida
    result = subprocess.run(
        command, 
        shell=True, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True
    )
    
    output = result.stdout
    errors = result.stderr
    combined_output = f"{output}\n{errors}"

    # CASO 1: ÉXITO - Retornamos una respuesta mínima (Gasto de tokens casi nulo)
    if result.returncode == 0:
        return (
            "--- RESUMEN EJECUTIVO DE ÉXITO ---\n"
            "STATUS: SUCCESS\n"
            f"Comando '{command}' finalizado correctamente.\n"
            "Todos los tests/compilación pasaron. No requieres analizar logs adicionales."
        )
    
    # CASO 2: FALLO - Filtramos inteligentemente para extraer solo la esencia del error
    else:
        # Extraemos líneas que usualmente contienen el fallo en suites de JS/TS
        lines = combined_output.splitlines()
        relevant_errors = []
        
        # Patrones comunes de error (puedes ajustarlo según tu suite: Jest, Vitest, etc.)
        error_patterns = [
            r"(?i)failed", r"(?i)error", r"✕", r"at\s+\S+", r"(\w+Error):"
        ]
        
        for line in lines:
            if any(re.search(pattern, line) for pattern in error_patterns):
                # Evitamos añadir líneas gigantes de dependencias o ruido repetitivo
                if len(line.strip()) < 200 and not "node_modules" in line:
                    relevant_errors.append(line.strip())
        
        # Si el filtro es muy estricto y no guardó nada, tomamos las últimas 20 líneas del log
        if not relevant_errors:
            relevant_errors = lines[-20:]
            
        summary_error = "\n".join(relevant_errors[:25]) # Limitamos a un máximo de 25 líneas clave
        
        return (
            "--- RESUMEN EJECUTIVO DE FALLO ---\n"
            "STATUS: FAILED\n"
            f"El comando '{command}' falló (Exit Code: {result.returncode}).\n\n"
            "LÍNEAS CLAVE DEL ERROR DETECTADAS:\n"
            "=========================================\n"
            f"{summary_error}\n"
            "=========================================\n"
            "Instrucción para la IA: Corrige el código basándote únicamente en estas líneas de error."
        )

if __name__ == "__main__":
    # Por defecto corre 'pnpm test', pero acepta 'pnpm build' si se pasa por argumento
    task = sys.argv[1] if len(sys.argv) > 1 else "pnpm test"
    
    if task not in ["pnpm test", "pnpm build"]:
        print("Comando no permitido por políticas de seguridad de la Skill.")
        sys.exit(1)
        
    resumen = run_pnpm_task(task)
    print(resumen)