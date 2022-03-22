# Screen Space Distance Fields
A demo implementation of a method for generating distance fields in screen space in real-time.
Note that the method has many cases were it creates artifacts or does not generate accurate results at a reasonable computational cost.

![](http://jaliborc.com/images/research/ssdf.png#2)

Demo running at [ssdf.jaliborc.com](http://ssdf.jaliborc.com/demo_distance.html).
Detailed description and analysis at chapter 4 of [this thesis](http://jaliborc.com/downloads/mscthesis.pdf). An excerpt follows:

> I choose to explore computing distance fields without resorting to additional geometry passes. Instead, I resort to searching the screen-space neighborhood. This strategy shares a premise with many screen space ambient occlusion methods, which is that the properties on a surface point can be approximated by the visible surrounding geometry.
