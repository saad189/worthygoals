const fs = require("fs");
const path = require("path");

// Path to your icons folder
const iconsFolder = path.join(__dirname, "../assets/icons");

// Helper function to convert snake_case to PascalCase
const toPascalCase = (str) => {
  return str
    .replace(/(_\w)/g, (matches) => matches[1].toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
};

// Generate component for each SVG file
const generateComponents = () => {
  // Read all SVG files in the icons folder
  const files = fs
    .readdirSync(iconsFolder)
    .filter((file) => file.endsWith(".svg"));

  // Create a string to store the generated code
  let componentsCode = `import React from 'react';\nimport { View, StyleSheet } from 'react-native';\n\n`;
  componentsCode += `import { Icon } from '@/models';\n`;
  let exportCode = "";

  // Loop over each file and generate import, component, and export
  files.forEach((file) => {
    if (file.endsWith(".png")) return;
    const iconName = file.replace(".svg", ""); // Remove the .svg extension
    const pascalCaseName = toPascalCase(iconName); // Convert file name to PascalCase
    const componentName = `${pascalCaseName}Icon`;

    // Generate import statement
    componentsCode += `import ${pascalCaseName} from '@/assets/icons/${file}';\n`;

    // Generate export statement
    exportCode += `
export const ${componentName} = ({ size, color, isFocused }: Icon) => {
        const cStyle = styles(color as string, size * 2);
    return (
         <View style={[cStyle.iconContainer, isFocused ? cStyle.focusedIconContainer : null]}>
            <${pascalCaseName} width={size} height={size} />
        </View>
    )
};\n`;
  });

  exportCode += `const styles = (color: string, size: number) => StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
    },
    focusedIconContainer: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        backgroundColor: color,
        borderRadius: 8,
    },
});`;
  // Path to the output file
  const outputPath = path.join(
    __dirname,
    "../components/Icons/CustomIcons.tsx"
  );

  // Clear the file before writing new data (truncate to 0 length)
  fs.writeFileSync(outputPath, "", "utf8");

  // Write the generated code to the file
  fs.writeFileSync(outputPath, componentsCode + exportCode, "utf8");
  console.log("Icons components generated successfully!");
};

// Run the script
generateComponents();
