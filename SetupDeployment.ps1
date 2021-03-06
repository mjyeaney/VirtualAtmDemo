<#

    .DESCRIPTION
        Establishes the basic infrastructure pieces for the HomeCenter demo.

#>

#
# Variables
#
$rgName = "VirtualAtmDemo"
$rgLocation = "East US"
$storageName = "virtualatmdemo02062018"
$appServiceName = "VirtualAtmDemoASP"
$appName = "VirtualAtmDemoApp"
$defaultSubscriptionName = "Personal-1A"

#
# Log Writer methods
#
function Log-Output($msg){
    $now = [DateTime]::Now
    Write-Output "[LOG $now]:: $msg"
}

#
# Locate/create resource group
#
Log-Output "Locating resource group..."
$rg = Get-AzureRmResourceGroup -Name $rgName -Location $rgLocation -ErrorAction SilentlyContinue
if ($rg -eq $null){
    Log-Output "Resource group not found - creating..."
    New-AzureRmResourceGroup -Name $rgName -Location $rgLocation
} else {
    Log-Output "Resource group already exists!"
}

#
# Create in/out storage account
#
$storageExists = $false
$storageAccount = Get-AzureRmStorageAccount -ResourceGroupName $rgName -Name $storageName -ErrorAction SilentlyContinue
if ($storageAccount -eq $null){
    Log-Output "Storage account not found - creating"
    New-AzureRmStorageAccount -Name $storageName -ResourceGroupName $rgName -SkuName Standard_LRS -Location $rgLocation -Kind Storage 
} else {
    $storageExists = $true
    Log-Output "Storage account already exists!"
}

#
# Setup CORS access to the account
#
if ($storageExists -eq $false){
    $storageKey = (Get-AzureRmStorageAccountKey -ResourceGroupName $rgName -StorageAccountName $storageName)[0].Value
    $storageContext = New-AzureStorageContext -StorageAccountKey $storageKey -StorageAccountName $storageName
    $CorsRules = (@{
        AllowedHeaders=@("*");
        AllowedOrigins=@("*");
        ExposedHeaders=@("content-length");
        MaxAgeInSeconds=200;
        AllowedMethods=@("Get","Connect", "Head")})
    Set-AzureStorageCORSRule -ServiceType Blob -CorsRules $CorsRules -Context $storageContext
    $CORSrule = Get-AzureStorageCORSRule -ServiceType Blob -Context $storageContext
    Log-Output "Current CORS rules:"
    Log-Output $CORSrule
}

# 
# Create app service plan
#
Log-Output "Locating app service environment..."
$ase = Get-AzureRmAppServicePlan -ResourceGroupName $rgName -Name $appServiceName -ErrorAction SilentlyContinue
if ($ase -eq $null){
    Log-Output "App service environment not found..creating"
    New-AzureRmAppServicePlan -Location $rgLocation -Tier "Free" -ResourceGroupName $rgName -Name $appServiceName
} else {
    Log-Output "App service environment already exists!"
    $ase = Get-AzureRmAppServicePlan -ResourceGroupName $rgName -Name $appServiceName
}

# 
# Crate web app
#
Log-Output "Locating Web App deployment..."
$app = Get-AzureRmWebApp -ResourceGroupName $rgName -Name $appName -ErrorAction SilentlyContinue
if ($app -eq $null){
    Log-Output "Web app deployment not found..creating"
    New-AzureRmWebApp -ResourceGroupName $rgName -Name $appName -Location $rgLocation -AppServicePlan $appPlanName

    # Start the web app
    Write-Host "INFO: Starting web app..."
    Start-AzureRmWebApp -ResourceGroupName $rgName -Name $appName
} else {
    Log-Output "Web app deployment already exists!"
    $app = Get-AzureRmWebApp -ResourceGroupName $rgName -Name $appName -ErrorAction SilentlyContinue
}

#
# TODO: Remaining setup: IoT Hub namespace, Stream Analytics Job (from JSON file), and Event Hubs
#