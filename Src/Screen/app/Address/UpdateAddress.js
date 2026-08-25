import React from "react";
import { Text, TextInput } from "react-native";

export default function UpdateAddress(){
    const getAllJSDocTags=(val)=>{
        
    }
    return(
        <View>
            <Text>
            <TextInput value="get mail" onChangeText={(val)=>getAllJSDocTags(val)}/>
            </Text>
        </View>
    )
}