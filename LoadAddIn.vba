Sub LoadDraftMateAddIn()
    Dim manifestPath As String
    manifestPath = "E:\AddInManifests\manifest.xml"
    
    On Error Resume Next
    Application.COMAddIns.Add manifestPath
    
    If Err.Number <> 0 Then
        MsgBox "Error loading add-in: " & Err.Description, vbCritical
    Else
        MsgBox "DraftMate add-in loaded successfully!", vbInformation
    End If
End Sub
