<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
	xmlns:xs="http://www.w3.org/2001/XMLSchema" 
	xmlns:xlink="http://www.w3.org/1999/xlink" 
	xmlns:vosi="http://www.ivoa.net/xml/VOSITables/v1.0"
	xmlns:json="http://json.org/">
	
	<xsl:output method="text" media-type="text/html" encoding="UTF-8" version="4.0" />
	<xsl:strip-space elements="name" />
	<!-- 
		Table are not at tyhe same level in VOSI1.1 (CADC 2016) resources or in Vizier
		    Vizier: /tableset/schema/table
		    VOSI1.1: /vosi:table
	 -->
	<xsl:template match="/">
				<xsl:apply-templates select="vosi:tableset/schema | tableset/schema" />
				<xsl:apply-templates select="table | vosi:table" />
	</xsl:template>
	
	<xsl:template match="vosi:tableset/schema | tableset/schema">
				<xsl:apply-templates select="table | vosi:table" />
	</xsl:template>
	
	<xsl:function name="json:encode-string" as="xs:string">
		<xsl:param name="string" as="xs:string?"/>
<!-- 		<xsl:sequence select="replace($string, '(\{|\}|\[|\]|\\|&quot;|\\n)', '\\$1')"/> -->	
        <xsl:sequence select="replace($string, '(\\|&quot;|\\n)', '\\$1')"/>	
    </xsl:function>
    
	<xsl:function name="json:remove-quotes" as="xs:string">
		<xsl:param name="string" as="xs:string?"/>
<!-- 		<xsl:sequence select="replace($string, '(\{|\}|\[|\]|\\|&quot;|\\n)', '\\$1')"/> -->	
        <xsl:sequence select="replace($string, '&quot;', '')"/>	
    </xsl:function>
	


<!-- 
Table name can be either tableName or schema.tableName 
but the variable TABLENAME is always given as schema.tableName 
At the ends, we want  name = schema.tableName 
-->
<xsl:template match="table | vosi:table">
<xsl:for-each select=".[name = 'TABLENAME' or ends-with(name, 'TABLENAME') or ends-with(name, '&quot;TABLENAME&quot;')]"><!-- xsl:if test="name = 'TABLENAME' or ends-with('TABLENAME', name) or ends-with('&quot;TABLENAME&quot;', name)" -->
{&quot;nodekey&quot;: &quot;NODEKEY&quot;,
<!--  &quot;table&quot;: &quot;<xsl:value-of select="name" />&quot;, -->
&quot;table&quot;: &quot;<xsl:value-of select="json:encode-string(name)"/>&quot;,
&quot;attributes&quot;: [

<xsl:for-each select="column">
<xsl:if test="position() > 1">,</xsl:if>
{&quot;nameattr&quot;: &quot;<xsl:value-of select="json:remove-quotes(name)"/>&quot;,
 &quot;nameorg&quot;: &quot;<xsl:value-of select="json:remove-quotes(name)"/>&quot;,
 &quot;unit&quot;: &quot;<xsl:value-of select="json:remove-quotes(unit)"/>&quot;,
 &quot;ucd&quot;: &quot;<xsl:value-of select="ucd" />&quot;,
 &quot;utype&quot;: &quot;<xsl:value-of select="utype" />&quot;,
 &quot;type&quot;: &quot;<xsl:value-of select="dataType" /><xsl:if test="dataType[@arraysize]">(<xsl:value-of select="dataType/@arraysize" />)</xsl:if>&quot;,
 &quot;dataType&quot;: &quot;<xsl:value-of select="dataType" /><xsl:if test="dataType[@arraysize]">(<xsl:value-of select="dataType/@arraysize" />)</xsl:if>&quot;,
 &quot;description&quot;: &quot;<xsl:value-of select="json:encode-string(description)"/>&quot;}
</xsl:for-each>]
}<!--  /xsl:if --></xsl:for-each>
</xsl:template>
</xsl:stylesheet>
